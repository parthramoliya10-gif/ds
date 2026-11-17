import { QuotationStatus, RequestStatus, Role, MessageType } from '@prisma/client';
import prisma from '../../config/prisma.js';
import { ApiError } from '../../utils/apiError.js';
import { AuthenticatedUser } from '../../types/express.js';
import razorpay from '../../config/razorpay.js';
import env from '../../config/env.js';

export interface CreateQuotationInput {
  requestId: string;
  totalAmount: number; // in Rupees from frontend
  terms?: string;
  estimatedDays?: number;
}

export class QuotationService {
  /**
   * Admin-only: Create and send a new quotation
   */
  async createQuotation(adminId: string, data: CreateQuotationInput) {
    // 1. Verify request exists
    const request = await prisma.documentRequest.findUnique({
      where: { id: data.requestId },
      include: { conversation: true },
    });

    if (!request) {
      throw new ApiError(404, 'Document request not found.');
    }

    // 2. Strict integer math in paise (zero floating-point precision error)
    const totalAmountPaise = Math.round(data.totalAmount * 100);
    const advanceAmountPaise = Math.floor(totalAmountPaise / 2);
    const remainingAmountPaise = totalAmountPaise - advanceAmountPaise;

    // 3. Count previous quotations for versioning
    const previousQuotationsCount = await prisma.quotation.count({
      where: { requestId: data.requestId },
    });
    const version = previousQuotationsCount + 1;

    // 4. Atomic transaction: Expire previous, create new, update request, inject Quotation Card into Chat
    const newQuotation = await prisma.$transaction(async (tx) => {
      // Mark any previous active quotation as EXPIRED
      await tx.quotation.updateMany({
        where: {
          requestId: data.requestId,
          status: QuotationStatus.SENT,
        },
        data: { status: QuotationStatus.EXPIRED },
      });

      // Create new quotation record
      const quotation = await tx.quotation.create({
        data: {
          requestId: data.requestId,
          version,
          totalAmount: totalAmountPaise,
          advanceAmount: advanceAmountPaise,
          remainingAmount: remainingAmountPaise,
          terms: data.terms,
          estimatedDays: data.estimatedDays,
          status: QuotationStatus.SENT,
        },
      });

      // Update Request status to QUOTED
      await tx.documentRequest.update({
        where: { id: data.requestId },
        data: { status: RequestStatus.QUOTED },
      });

      // Automatically post Interactive Quotation Card in the real-time chat
      if (request.conversation) {
        await tx.message.create({
          data: {
            conversationId: request.conversation.id,
            senderId: adminId,
            senderRole: Role.ADMIN,
            messageType: MessageType.QUOTATION_CARD,
            content: `Quotation (v${version}): ₹${data.totalAmount} (50% Advance: ₹${advanceAmountPaise / 100}, 50% Final: ₹${remainingAmountPaise / 100})`,
            metadata: {
              quotationId: quotation.id,
              version: quotation.version,
              totalAmount: totalAmountPaise,
              advanceAmount: advanceAmountPaise,
              remainingAmount: remainingAmountPaise,
              estimatedDays: data.estimatedDays,
              terms: data.terms,
            },
          },
        });
      }

      // Record Audit Log
      await tx.auditLog.create({
        data: {
          actorId: adminId,
          requestId: data.requestId,
          action: 'QUOTATION_SENT',
          metadata: {
            quotationId: quotation.id,
            version,
            totalAmount: totalAmountPaise,
          },
        },
      });

      return quotation;
    }, {
      maxWait: 15000,
      timeout: 20000,
    });

    return newQuotation;
  }

  /**
   * Get all quotation versions for a request with ownership guard
   */
  async getQuotationsForRequest(requestId: string, user: AuthenticatedUser) {
    const request = await prisma.documentRequest.findUnique({
      where: { id: requestId },
      select: { userId: true },
    });

    if (!request) {
      throw new ApiError(404, 'Document request not found.');
    }

    if (user.role !== Role.ADMIN && request.userId !== user.id) {
      throw new ApiError(403, 'Forbidden: You do not have access to quotations for this request.');
    }

    const quotations = await prisma.quotation.findMany({
      where: { requestId },
      orderBy: { version: 'desc' },
      include: {
        payments: true,
      },
    });

    return quotations;
  }

  /**
   * User accepts a quotation and initiates Milestone 1 (50% Advance Razorpay order)
   */
  async acceptQuotation(userId: string, quotationId: string) {
    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: {
        request: {
          include: { conversation: true },
        },
      },
    });

    if (!quotation) {
      throw new ApiError(404, 'Quotation not found.');
    }

    if (quotation.request.userId !== userId) {
      throw new ApiError(403, 'Forbidden: You can only accept quotations for your own requests.');
    }

    if (quotation.status !== QuotationStatus.SENT) {
      throw new ApiError(400, `Cannot accept quotation in '${quotation.status}' status.`);
    }

    // 1. Mark quotation as ACCEPTED
    const acceptedQuotation = await prisma.quotation.update({
      where: { id: quotationId },
      data: { status: QuotationStatus.ACCEPTED },
    });

    // 2. Generate Razorpay Order for Milestone 1 (50% Advance)
    const receipt = `rcpt_adv_${quotation.id.slice(0, 8)}_${Date.now()}`.slice(0, 40);
    const razorpayOrder = await razorpay.orders.create({
      amount: quotation.advanceAmount,
      currency: 'INR',
      receipt,
      notes: {
        requestId: quotation.requestId,
        quotationId: quotation.id,
        milestone: 'ADVANCE_50',
        userId,
      },
    });

    // 3. Save pending payment record in DB
    const payment = await prisma.payment.create({
      data: {
        userId,
        requestId: quotation.requestId,
        quotationId: quotation.id,
        milestone: 'ADVANCE_50',
        amount: quotation.advanceAmount,
        currency: 'INR',
        status: 'PENDING',
        razorpayOrderId: razorpayOrder.id,
      },
    });

    // 4. Inject System Message into Chat
    if (quotation.request.conversation) {
      await prisma.message.create({
        data: {
          conversationId: quotation.request.conversation.id,
          senderId: userId,
          senderRole: Role.USER,
          messageType: MessageType.SYSTEM,
          content: `Quotation (v${quotation.version}) accepted by user. 50% Advance payment initiated (₹${quotation.advanceAmount / 100}).`,
        },
      });
    }

    // 5. Record Audit Log
    await prisma.auditLog.create({
      data: {
        actorId: userId,
        requestId: quotation.requestId,
        action: 'QUOTATION_ACCEPTED',
        metadata: {
          quotationId: quotation.id,
          advanceOrderId: razorpayOrder.id,
        },
      },
    });

    return {
      quotation: acceptedQuotation,
      paymentOrder: {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: env.RAZORPAY_KEY_ID,
        milestone: 'ADVANCE_50',
        paymentRecordId: payment.id,
      },
    };
  }

  /**
   * User rejects a quotation
   */
  async rejectQuotation(userId: string, quotationId: string, reason?: string) {
    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: {
        request: {
          include: { conversation: true },
        },
      },
    });

    if (!quotation) {
      throw new ApiError(404, 'Quotation not found.');
    }

    if (quotation.request.userId !== userId) {
      throw new ApiError(403, 'Forbidden: You can only reject quotations for your own requests.');
    }

    if (quotation.status !== QuotationStatus.SENT) {
      throw new ApiError(400, `Cannot reject quotation in '${quotation.status}' status.`);
    }

    const rejectedQuotation = await prisma.quotation.update({
      where: { id: quotationId },
      data: { status: QuotationStatus.REJECTED },
    });

    // Post notification in chat
    if (quotation.request.conversation) {
      await prisma.message.create({
        data: {
          conversationId: quotation.request.conversation.id,
          senderId: userId,
          senderRole: Role.USER,
          messageType: MessageType.SYSTEM,
          content: `Quotation (v${quotation.version}) rejected by user.${reason ? ` Reason: ${reason}` : ''}`,
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        actorId: userId,
        requestId: quotation.requestId,
        action: 'QUOTATION_REJECTED',
        metadata: { quotationId: quotation.id, reason },
      },
    });

    return rejectedQuotation;
  }
}

export const quotationService = new QuotationService();
export default quotationService;
