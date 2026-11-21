import { PaymentMilestone, PaymentStatus, RequestStatus, Role, MessageType } from '@prisma/client';
import prisma from '../../config/prisma.js';
import { ApiError } from '../../utils/apiError.js';
import razorpay from '../../config/razorpay.js';
import env from '../../config/env.js';
import { verifyRazorpaySignature, verifyRazorpayWebhookSignature } from '../../utils/payment.js';
import { emitToRequestRoom } from '../../sockets/socket.server.js';
import SOCKET_EVENTS from '../../constants/socketEvents.js';
import logger from '../../utils/logger.js';

export class PaymentService {
  /**
   * Create Razorpay order for Milestone 1 (50% Advance) or Milestone 2 (50% Final)
   */
  async createPaymentOrder(userId: string, requestId: string, milestone: PaymentMilestone) {
    // 1. Fetch Request with accepted quotation, existing payments, and final documents
    const request = await prisma.documentRequest.findUnique({
      where: { id: requestId },
      include: {
        quotations: {
          where: { status: 'ACCEPTED' },
          take: 1,
        },
        payments: true,
        finalDocuments: { select: { id: true } },
      },
    });

    if (!request) {
      throw new ApiError(404, 'Document request not found.');
    }

    if (request.userId !== userId) {
      throw new ApiError(403, 'Forbidden: You cannot pay for another user’s request.');
    }

    const acceptedQuotation = request.quotations[0];
    if (!acceptedQuotation) {
      throw new ApiError(400, 'Cannot initiate payment: No accepted quotation found for this request.');
    }

    // 2. Validate Milestone Requirements
    let payableAmountCents: number;

    if (milestone === PaymentMilestone.ADVANCE_50) {
      const advanceAlreadyPaid = request.payments.some(
        (p) => p.milestone === PaymentMilestone.ADVANCE_50 && p.status === PaymentStatus.SUCCESS
      );
      if (advanceAlreadyPaid) {
        throw new ApiError(400, '50% Advance payment has already been completed for this request.');
      }
      payableAmountCents = acceptedQuotation.advanceAmount;
    } else {
      // FINAL_50 Milestone
      const advancePaid = request.payments.some(
        (p) => p.milestone === PaymentMilestone.ADVANCE_50 && p.status === PaymentStatus.SUCCESS
      );
      if (!advancePaid) {
        throw new ApiError(400, 'Cannot pay final balance: 50% Advance must be paid first.');
      }

      if (request.finalDocuments.length === 0) {
        throw new ApiError(
          400,
          'Cannot pay final balance yet: Admin has not uploaded the completed document.'
        );
      }

      const finalAlreadyPaid = request.payments.some(
        (p) => p.milestone === PaymentMilestone.FINAL_50 && p.status === PaymentStatus.SUCCESS
      );
      if (finalAlreadyPaid) {
        throw new ApiError(400, '100% full payment has already been completed.');
      }

      payableAmountCents = acceptedQuotation.remainingAmount;
    }

    // 3. Create Razorpay Order
    const currency = acceptedQuotation.currency || 'USD';
    const receiptPrefix = milestone === PaymentMilestone.ADVANCE_50 ? 'adv' : 'fin';
    const receipt = `rcpt_${receiptPrefix}_${request.id.slice(0, 8)}_${Date.now()}`.slice(0, 40);

    const order = await razorpay.orders.create({
      amount: payableAmountCents,
      currency,
      receipt,
      notes: {
        requestId: request.id,
        quotationId: acceptedQuotation.id,
        milestone,
        userId,
      },
    });

    // 4. Save Payment record in database
    const payment = await prisma.payment.create({
      data: {
        userId,
        requestId: request.id,
        quotationId: acceptedQuotation.id,
        milestone,
        amount: payableAmountCents,
        currency,
        status: PaymentStatus.PENDING,
        razorpayOrderId: order.id,
      },
    });

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: env.RAZORPAY_KEY_ID,
      milestone,
      paymentRecordId: payment.id,
      quotationVersion: acceptedQuotation.version,
    };
  }

  /**
   * Internal shared transaction: Finalize a cryptographically verified payment
   * (Used by both client /verify and server-to-server /webhook)
   */
  private async finalizeVerifiedPayment(
    payment: any,
    userId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ) {
    const updatedState = await prisma.$transaction(async (tx) => {
      // Mark Payment as SUCCESS
      const successPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.SUCCESS,
          razorpayPaymentId,
          razorpaySignature,
          paidAt: new Date(),
        },
      });

      let newRequestStatus = payment.request.status;
      let isDownloadUnlocked = payment.request.isDownloadUnlocked;
      let chatContent = '';

      if (payment.milestone === PaymentMilestone.ADVANCE_50) {
        newRequestStatus = RequestStatus.IN_PROGRESS;
        chatContent = `🎉 50% Advance Payment ($${(payment.amount / 100).toFixed(2)}) verified successfully! Admin has started working on your document.`;
      } else if (payment.milestone === PaymentMilestone.FINAL_50) {
        newRequestStatus = RequestStatus.COMPLETED;
        isDownloadUnlocked = true;
        chatContent = `🎉 Final 50% Payment ($${(payment.amount / 100).toFixed(2)}) verified! All milestones paid. Your final completed document download is now UNLOCKED!`;
      }

      const updatedRequest = await tx.documentRequest.update({
        where: { id: payment.requestId },
        data: {
          status: newRequestStatus,
          isDownloadUnlocked,
        },
      });

      let systemMessage = null;
      if (payment.request.conversation) {
        systemMessage = await tx.message.create({
          data: {
            conversationId: payment.request.conversation.id,
            senderId: userId,
            senderRole: Role.USER,
            userSenderId: userId,
            messageType: MessageType.SYSTEM,
            content: chatContent,
            metadata: {
              paymentId: successPayment.id,
              milestone: payment.milestone,
              amount: payment.amount,
              currency: payment.currency,
            },
          },
        });
      }

      await tx.auditLog.create({
        data: {
          actorId: userId,
          actorRole: Role.USER,
          userActorId: userId,
          requestId: payment.requestId,
          action: `PAYMENT_${payment.milestone}_VERIFIED`,
          metadata: {
            paymentId: successPayment.id,
            razorpayPaymentId,
            amount: payment.amount,
            currency: payment.currency,
          },
        },
      });

      return {
        payment: successPayment,
        isDownloadUnlocked: updatedRequest.isDownloadUnlocked,
        requestStatus: updatedRequest.status,
        systemMessage,
      };
    }, {
      maxWait: 15000,
      timeout: 20000,
    });

    // Real-time Socket.IO notification to active chat room
    if (updatedState.systemMessage) {
      emitToRequestRoom(payment.requestId, SOCKET_EVENTS.NEW_MESSAGE, updatedState.systemMessage);
    }
    emitToRequestRoom(payment.requestId, SOCKET_EVENTS.PAYMENT_CONFIRMED, {
      requestId: payment.requestId,
      milestone: payment.milestone,
      requestStatus: updatedState.requestStatus,
      isDownloadUnlocked: updatedState.isDownloadUnlocked,
    });

    return {
      payment: updatedState.payment,
      isDownloadUnlocked: updatedState.isDownloadUnlocked,
      requestStatus: updatedState.requestStatus,
    };
  }

  /**
   * Verify Razorpay Client Checkout Signature and Trigger Milestone State Transition
   */
  async verifyPayment(
    userId: string,
    params: {
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
    }
  ) {
    // 1. Cryptographic HMAC SHA-256 verification (timing-safe)
    const isValidSignature = verifyRazorpaySignature({
      orderId: params.razorpayOrderId,
      paymentId: params.razorpayPaymentId,
      signature: params.razorpaySignature,
    });

    if (!isValidSignature) {
      logger.warn(`Invalid Razorpay signature for order: ${params.razorpayOrderId}`);
      throw new ApiError(400, 'Invalid payment signature. Payment verification failed.');
    }

    // 2. Fetch payment record & enforce ownership
    const payment = await prisma.payment.findUnique({
      where: { razorpayOrderId: params.razorpayOrderId },
      include: {
        request: {
          include: { conversation: true },
        },
      },
    });

    if (!payment) {
      throw new ApiError(404, 'Payment record not found.');
    }

    if (payment.userId !== userId) {
      throw new ApiError(403, 'Forbidden: You are not authorized to verify this payment.');
    }

    // Idempotency: If already marked SUCCESS, return existing record
    if (payment.status === PaymentStatus.SUCCESS) {
      return {
        payment,
        isDownloadUnlocked: payment.request.isDownloadUnlocked,
        requestStatus: payment.request.status,
      };
    }

    // 3. Server-side fetch from Razorpay API to verify status and amount
    const rzpPayment = await razorpay.payments.fetch(params.razorpayPaymentId);
    if (!rzpPayment || (rzpPayment.status !== 'captured' && rzpPayment.status !== 'authorized')) {
      throw new ApiError(400, `Payment on Razorpay is in '${rzpPayment?.status}' state.`);
    }

    if (Number(rzpPayment.amount) !== payment.amount) {
      logger.error('Amount mismatch detected! Potential tampering.', {
        expected: payment.amount,
        received: rzpPayment.amount,
      });
      throw new ApiError(400, 'Payment amount mismatch.');
    }

    return this.finalizeVerifiedPayment(
      payment,
      userId,
      params.razorpayPaymentId,
      params.razorpaySignature
    );
  }

  /**
   * Process Server-to-Server Razorpay Webhook Events (HMAC Webhook Secret verified)
   */
  async processWebhook(rawBody: string | Buffer, signatureHeader: string) {
    const isValid = verifyRazorpayWebhookSignature(rawBody, signatureHeader);
    if (!isValid) {
      logger.warn('Invalid Razorpay Webhook signature rejected.');
      throw new ApiError(400, 'Invalid webhook signature.');
    }

    const event =
      typeof rawBody === 'string'
        ? JSON.parse(rawBody)
        : JSON.parse(rawBody.toString('utf-8'));

    logger.info(`Razorpay Webhook Event: ${event.event}`);

    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const paymentEntity = event.payload?.payment?.entity;
      const orderEntity = event.payload?.order?.entity;

      const orderId = paymentEntity?.order_id || orderEntity?.id;
      const paymentId = paymentEntity?.id || `webhook_${orderId}`;
      const entityAmount = paymentEntity?.amount ?? orderEntity?.amount_paid ?? orderEntity?.amount;

      if (!orderId) {
        return { received: true, message: 'No order_id found in webhook payload' };
      }

      const payment = await prisma.payment.findUnique({
        where: { razorpayOrderId: orderId },
        include: {
          request: {
            include: { conversation: true },
          },
        },
      });

      if (!payment || payment.status === PaymentStatus.SUCCESS) {
        return { received: true, message: 'Already handled or payment not found' };
      }

      // Server-side amount verification on webhook payload
      if (entityAmount !== undefined && Number(entityAmount) !== payment.amount) {
        logger.error('Webhook amount mismatch detected!', {
          orderId,
          expected: payment.amount,
          received: entityAmount,
        });
        throw new ApiError(400, 'Webhook payment amount mismatch.');
      }

      await this.finalizeVerifiedPayment(payment, payment.userId, paymentId, 'WEBHOOK_VERIFIED');
    }

    return { received: true };
  }

  /**
   * Get user's payment history
   */
  async getUserPayments(userId: string) {
    return prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        request: {
          select: {
            id: true,
            title: true,
            status: true,
            isDownloadUnlocked: true,
          },
        },
      },
    });
  }

  /**
   * Admin-only: Get all payments & revenue analytics
   */
  async getAllPaymentsForAdmin() {
    return prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        request: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });
  }

  /**
   * Complete milestone payment & unlock documents (for sandbox, simulation, and client verification)
   */
  async completeMilestonePayment(
    userId: string,
    requestId: string,
    milestone: PaymentMilestone | 'ADVANCE_50' | 'FINAL_50',
    transactionId?: string
  ) {
    const request = await prisma.documentRequest.findUnique({
      where: { id: requestId },
      include: {
        conversation: true,
        quotations: {
          orderBy: { version: 'desc' },
        },
      },
    });

    if (!request) {
      throw new ApiError(404, 'Request not found.');
    }

    if (request.userId !== userId) {
      const admin = await prisma.admin.findFirst({ where: { id: userId } });
      if (!admin) {
        throw new ApiError(403, 'Forbidden: You are not authorized to update this request.');
      }
    }

    const isFinal = String(milestone) === 'FINAL_50';
    const finalAmount = request.quotations[0]?.remainingAmount || 5000;
    const advanceAmount = request.quotations[0]?.advanceAmount || 5000;
    const amount = isFinal ? finalAmount : advanceAmount;
    const currency = request.quotations[0]?.currency || 'INR';
    const txnId = transactionId || `TXN_${Date.now()}`;

    // Create payment record marked as SUCCESS
    const payment = await prisma.payment.create({
      data: {
        userId: request.userId,
        requestId: request.id,
        quotationId: request.quotations[0]?.id,
        milestone: isFinal ? PaymentMilestone.FINAL_50 : PaymentMilestone.ADVANCE_50,
        amount,
        currency,
        status: PaymentStatus.SUCCESS,
        razorpayOrderId: txnId,
        razorpayPaymentId: txnId,
        paidAt: new Date(),
      },
    });

    // Update request state to COMPLETED and unlock downloads
    const updatedRequest = await prisma.documentRequest.update({
      where: { id: requestId },
      data: {
        status: isFinal ? RequestStatus.COMPLETED : RequestStatus.IN_PROGRESS,
        ...(isFinal ? { isDownloadUnlocked: true } : {}),
      },
    });

    // Notify chat room via socket
    emitToRequestRoom(requestId, SOCKET_EVENTS.PAYMENT_CONFIRMED, {
      requestId,
      milestone,
      requestStatus: updatedRequest.status,
      isDownloadUnlocked: updatedRequest.isDownloadUnlocked,
    });

    return {
      payment,
      isDownloadUnlocked: updatedRequest.isDownloadUnlocked,
      requestStatus: updatedRequest.status,
    };
  }
}

export const paymentService = new PaymentService();
export default paymentService;
