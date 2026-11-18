import { PaymentMilestone, PaymentStatus, RequestStatus, Role, MessageType } from '@prisma/client';
import prisma from '../../config/prisma.js';
import { ApiError } from '../../utils/apiError.js';
import razorpay from '../../config/razorpay.js';
import env from '../../config/env.js';
import { verifyRazorpaySignature, verifyRazorpayWebhookSignature } from '../../utils/payment.js';
import logger from '../../utils/logger.js';

export class PaymentService {
  /**
   * Create Razorpay order for Milestone 1 (50% Advance) or Milestone 2 (50% Final)
   */
  async createPaymentOrder(userId: string, requestId: string, milestone: PaymentMilestone) {
    // 1. Fetch Request with accepted quotation and existing payments
    const request = await prisma.documentRequest.findUnique({
      where: { id: requestId },
      include: {
        quotations: {
          where: { status: 'ACCEPTED' },
          take: 1,
        },
        payments: true,
        finalDocuments: true,
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
      // Check if advance already paid
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
   * Verify Razorpay Payment Signature and Trigger Milestone State Transition
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

    // 2. Fetch payment record
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

    // 4. Atomic Transaction: Update payment status, update request state, inject chat message, audit log
    const updatedState = await prisma.$transaction(async (tx) => {
      // Mark Payment as SUCCESS
      const successPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.SUCCESS,
          razorpayPaymentId: params.razorpayPaymentId,
          razorpaySignature: params.razorpaySignature,
          paidAt: new Date(),
        },
      });

      let newRequestStatus = payment.request.status;
      let isDownloadUnlocked = payment.request.isDownloadUnlocked;
      let chatContent = '';

      if (payment.milestone === PaymentMilestone.ADVANCE_50) {
        // Milestone 1 complete: Admin starts work
        newRequestStatus = RequestStatus.IN_PROGRESS;
        chatContent = `🎉 50% Advance Payment ($${(payment.amount / 100).toFixed(2)}) verified successfully! Admin has started working on your document.`;
      } else if (payment.milestone === PaymentMilestone.FINAL_50) {
        // Milestone 2 complete: Document download is UNLOCKED!
        newRequestStatus = RequestStatus.COMPLETED;
        isDownloadUnlocked = true;
        chatContent = `🎉 Final 50% Payment ($${(payment.amount / 100).toFixed(2)}) verified! All milestones paid. Your final completed document download is now UNLOCKED!`;
      }

      // Update Document Request
      const updatedRequest = await tx.documentRequest.update({
        where: { id: payment.requestId },
        data: {
          status: newRequestStatus,
          isDownloadUnlocked,
        },
      });

      // Post notification in Chat
      if (payment.request.conversation) {
        await tx.message.create({
          data: {
            conversationId: payment.request.conversation.id,
            senderId: userId,
            senderRole: Role.USER,
            messageType: MessageType.SYSTEM,
            content: chatContent,
            metadata: {
              paymentId: successPayment.id,
              milestone: payment.milestone,
              amount: payment.amount,
            },
          },
        });
      }

      // Record Audit Log
      await tx.auditLog.create({
        data: {
          actorId: userId,
          requestId: payment.requestId,
          action: `PAYMENT_${payment.milestone}_VERIFIED`,
          metadata: {
            paymentId: successPayment.id,
            razorpayPaymentId: params.razorpayPaymentId,
            amount: payment.amount,
          },
        },
      });

      return {
        payment: successPayment,
        isDownloadUnlocked: updatedRequest.isDownloadUnlocked,
        requestStatus: updatedRequest.status,
      };
    }, {
      maxWait: 15000,
      timeout: 20000,
    });

    return updatedState;
  }

  /**
   * Process Server-to-Server Razorpay Webhook Events
   */
  async processWebhook(rawBody: string | Buffer, signatureHeader: string) {
    const isValid = verifyRazorpayWebhookSignature(rawBody, signatureHeader);
    if (!isValid) {
      logger.warn('Invalid Razorpay Webhook signature rejected.');
      throw new ApiError(400, 'Invalid webhook signature.');
    }

    const event = typeof rawBody === 'string' ? JSON.parse(rawBody) : JSON.parse(rawBody.toString('utf-8'));
    logger.info(`Razorpay Webhook Event: ${event.event}`);

    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const entity = event.payload.payment?.entity || event.payload.order?.entity;
      const orderId = entity.order_id || entity.id;

      const payment = await prisma.payment.findUnique({
        where: { razorpayOrderId: orderId },
        include: { request: true },
      });

      if (!payment || payment.status === PaymentStatus.SUCCESS) {
        return { message: 'Already handled or not found' };
      }

      // Perform state transition
      const paymentId = entity.id;
      await this.verifyPayment(payment.userId, {
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: 'WEBHOOK_VERIFIED',
      });
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
}

export const paymentService = new PaymentService();
export default paymentService;
