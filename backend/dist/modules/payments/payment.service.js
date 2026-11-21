"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentService = exports.PaymentService = void 0;
const client_1 = require("@prisma/client");
const prisma_js_1 = __importDefault(require("../../config/prisma.js"));
const apiError_js_1 = require("../../utils/apiError.js");
const razorpay_js_1 = __importDefault(require("../../config/razorpay.js"));
const env_js_1 = __importDefault(require("../../config/env.js"));
const payment_js_1 = require("../../utils/payment.js");
const socket_server_js_1 = require("../../sockets/socket.server.js");
const socketEvents_js_1 = __importDefault(require("../../constants/socketEvents.js"));
const logger_js_1 = __importDefault(require("../../utils/logger.js"));
class PaymentService {
    /**
     * Create Razorpay order for Milestone 1 (50% Advance) or Milestone 2 (50% Final)
     */
    async createPaymentOrder(userId, requestId, milestone) {
        // 1. Fetch Request with accepted quotation, existing payments, and final documents
        const request = await prisma_js_1.default.documentRequest.findUnique({
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
            throw new apiError_js_1.ApiError(404, 'Document request not found.');
        }
        if (request.userId !== userId) {
            throw new apiError_js_1.ApiError(403, 'Forbidden: You cannot pay for another user’s request.');
        }
        const acceptedQuotation = request.quotations[0];
        if (!acceptedQuotation) {
            throw new apiError_js_1.ApiError(400, 'Cannot initiate payment: No accepted quotation found for this request.');
        }
        // 2. Validate Milestone Requirements
        let payableAmountCents;
        if (milestone === client_1.PaymentMilestone.ADVANCE_50) {
            const advanceAlreadyPaid = request.payments.some((p) => p.milestone === client_1.PaymentMilestone.ADVANCE_50 && p.status === client_1.PaymentStatus.SUCCESS);
            if (advanceAlreadyPaid) {
                throw new apiError_js_1.ApiError(400, '50% Advance payment has already been completed for this request.');
            }
            payableAmountCents = acceptedQuotation.advanceAmount;
        }
        else {
            // FINAL_50 Milestone
            const advancePaid = request.payments.some((p) => p.milestone === client_1.PaymentMilestone.ADVANCE_50 && p.status === client_1.PaymentStatus.SUCCESS);
            if (!advancePaid) {
                throw new apiError_js_1.ApiError(400, 'Cannot pay final balance: 50% Advance must be paid first.');
            }
            if (request.finalDocuments.length === 0) {
                throw new apiError_js_1.ApiError(400, 'Cannot pay final balance yet: Admin has not uploaded the completed document.');
            }
            const finalAlreadyPaid = request.payments.some((p) => p.milestone === client_1.PaymentMilestone.FINAL_50 && p.status === client_1.PaymentStatus.SUCCESS);
            if (finalAlreadyPaid) {
                throw new apiError_js_1.ApiError(400, '100% full payment has already been completed.');
            }
            payableAmountCents = acceptedQuotation.remainingAmount;
        }
        // 3. Create Razorpay Order
        const currency = acceptedQuotation.currency || 'USD';
        const receiptPrefix = milestone === client_1.PaymentMilestone.ADVANCE_50 ? 'adv' : 'fin';
        const receipt = `rcpt_${receiptPrefix}_${request.id.slice(0, 8)}_${Date.now()}`.slice(0, 40);
        const order = await razorpay_js_1.default.orders.create({
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
        const payment = await prisma_js_1.default.payment.create({
            data: {
                userId,
                requestId: request.id,
                quotationId: acceptedQuotation.id,
                milestone,
                amount: payableAmountCents,
                currency,
                status: client_1.PaymentStatus.PENDING,
                razorpayOrderId: order.id,
            },
        });
        return {
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: env_js_1.default.RAZORPAY_KEY_ID,
            milestone,
            paymentRecordId: payment.id,
            quotationVersion: acceptedQuotation.version,
        };
    }
    /**
     * Internal shared transaction: Finalize a cryptographically verified payment
     * (Used by both client /verify and server-to-server /webhook)
     */
    async finalizeVerifiedPayment(payment, userId, razorpayPaymentId, razorpaySignature) {
        const updatedState = await prisma_js_1.default.$transaction(async (tx) => {
            // Mark Payment as SUCCESS
            const successPayment = await tx.payment.update({
                where: { id: payment.id },
                data: {
                    status: client_1.PaymentStatus.SUCCESS,
                    razorpayPaymentId,
                    razorpaySignature,
                    paidAt: new Date(),
                },
            });
            let newRequestStatus = payment.request.status;
            let isDownloadUnlocked = payment.request.isDownloadUnlocked;
            let chatContent = '';
            if (payment.milestone === client_1.PaymentMilestone.ADVANCE_50) {
                newRequestStatus = client_1.RequestStatus.IN_PROGRESS;
                chatContent = `🎉 50% Advance Payment ($${(payment.amount / 100).toFixed(2)}) verified successfully! Admin has started working on your document.`;
            }
            else if (payment.milestone === client_1.PaymentMilestone.FINAL_50) {
                newRequestStatus = client_1.RequestStatus.COMPLETED;
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
                        senderRole: client_1.Role.USER,
                        userSenderId: userId,
                        messageType: client_1.MessageType.SYSTEM,
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
                    actorRole: client_1.Role.USER,
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
            (0, socket_server_js_1.emitToRequestRoom)(payment.requestId, socketEvents_js_1.default.NEW_MESSAGE, updatedState.systemMessage);
        }
        (0, socket_server_js_1.emitToRequestRoom)(payment.requestId, socketEvents_js_1.default.PAYMENT_CONFIRMED, {
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
    async verifyPayment(userId, params) {
        // 1. Cryptographic HMAC SHA-256 verification (timing-safe)
        const isValidSignature = (0, payment_js_1.verifyRazorpaySignature)({
            orderId: params.razorpayOrderId,
            paymentId: params.razorpayPaymentId,
            signature: params.razorpaySignature,
        });
        if (!isValidSignature) {
            logger_js_1.default.warn(`Invalid Razorpay signature for order: ${params.razorpayOrderId}`);
            throw new apiError_js_1.ApiError(400, 'Invalid payment signature. Payment verification failed.');
        }
        // 2. Fetch payment record & enforce ownership
        const payment = await prisma_js_1.default.payment.findUnique({
            where: { razorpayOrderId: params.razorpayOrderId },
            include: {
                request: {
                    include: { conversation: true },
                },
            },
        });
        if (!payment) {
            throw new apiError_js_1.ApiError(404, 'Payment record not found.');
        }
        if (payment.userId !== userId) {
            throw new apiError_js_1.ApiError(403, 'Forbidden: You are not authorized to verify this payment.');
        }
        // Idempotency: If already marked SUCCESS, return existing record
        if (payment.status === client_1.PaymentStatus.SUCCESS) {
            return {
                payment,
                isDownloadUnlocked: payment.request.isDownloadUnlocked,
                requestStatus: payment.request.status,
            };
        }
        // 3. Server-side fetch from Razorpay API to verify status and amount
        const rzpPayment = await razorpay_js_1.default.payments.fetch(params.razorpayPaymentId);
        if (!rzpPayment || (rzpPayment.status !== 'captured' && rzpPayment.status !== 'authorized')) {
            throw new apiError_js_1.ApiError(400, `Payment on Razorpay is in '${rzpPayment?.status}' state.`);
        }
        if (Number(rzpPayment.amount) !== payment.amount) {
            logger_js_1.default.error('Amount mismatch detected! Potential tampering.', {
                expected: payment.amount,
                received: rzpPayment.amount,
            });
            throw new apiError_js_1.ApiError(400, 'Payment amount mismatch.');
        }
        return this.finalizeVerifiedPayment(payment, userId, params.razorpayPaymentId, params.razorpaySignature);
    }
    /**
     * Process Server-to-Server Razorpay Webhook Events (HMAC Webhook Secret verified)
     */
    async processWebhook(rawBody, signatureHeader) {
        const isValid = (0, payment_js_1.verifyRazorpayWebhookSignature)(rawBody, signatureHeader);
        if (!isValid) {
            logger_js_1.default.warn('Invalid Razorpay Webhook signature rejected.');
            throw new apiError_js_1.ApiError(400, 'Invalid webhook signature.');
        }
        const event = typeof rawBody === 'string'
            ? JSON.parse(rawBody)
            : JSON.parse(rawBody.toString('utf-8'));
        logger_js_1.default.info(`Razorpay Webhook Event: ${event.event}`);
        if (event.event === 'payment.captured' || event.event === 'order.paid') {
            const paymentEntity = event.payload?.payment?.entity;
            const orderEntity = event.payload?.order?.entity;
            const orderId = paymentEntity?.order_id || orderEntity?.id;
            const paymentId = paymentEntity?.id || `webhook_${orderId}`;
            const entityAmount = paymentEntity?.amount ?? orderEntity?.amount_paid ?? orderEntity?.amount;
            if (!orderId) {
                return { received: true, message: 'No order_id found in webhook payload' };
            }
            const payment = await prisma_js_1.default.payment.findUnique({
                where: { razorpayOrderId: orderId },
                include: {
                    request: {
                        include: { conversation: true },
                    },
                },
            });
            if (!payment || payment.status === client_1.PaymentStatus.SUCCESS) {
                return { received: true, message: 'Already handled or payment not found' };
            }
            // Server-side amount verification on webhook payload
            if (entityAmount !== undefined && Number(entityAmount) !== payment.amount) {
                logger_js_1.default.error('Webhook amount mismatch detected!', {
                    orderId,
                    expected: payment.amount,
                    received: entityAmount,
                });
                throw new apiError_js_1.ApiError(400, 'Webhook payment amount mismatch.');
            }
            await this.finalizeVerifiedPayment(payment, payment.userId, paymentId, 'WEBHOOK_VERIFIED');
        }
        return { received: true };
    }
    /**
     * Get user's payment history
     */
    async getUserPayments(userId) {
        return prisma_js_1.default.payment.findMany({
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
        return prisma_js_1.default.payment.findMany({
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
    async completeMilestonePayment(userId, requestId, milestone, transactionId) {
        const request = await prisma_js_1.default.documentRequest.findUnique({
            where: { id: requestId },
            include: {
                conversation: true,
                quotations: {
                    orderBy: { version: 'desc' },
                },
            },
        });
        if (!request) {
            throw new apiError_js_1.ApiError(404, 'Request not found.');
        }
        if (request.userId !== userId) {
            const admin = await prisma_js_1.default.admin.findFirst({ where: { id: userId } });
            if (!admin) {
                throw new apiError_js_1.ApiError(403, 'Forbidden: You are not authorized to update this request.');
            }
        }
        const isFinal = String(milestone) === 'FINAL_50';
        const finalAmount = request.quotations[0]?.remainingAmount || 5000;
        const advanceAmount = request.quotations[0]?.advanceAmount || 5000;
        const amount = isFinal ? finalAmount : advanceAmount;
        const currency = request.quotations[0]?.currency || 'INR';
        const txnId = transactionId || `TXN_${Date.now()}`;
        // Create payment record marked as SUCCESS
        const payment = await prisma_js_1.default.payment.create({
            data: {
                userId: request.userId,
                requestId: request.id,
                quotationId: request.quotations[0]?.id,
                milestone: isFinal ? client_1.PaymentMilestone.FINAL_50 : client_1.PaymentMilestone.ADVANCE_50,
                amount,
                currency,
                status: client_1.PaymentStatus.SUCCESS,
                razorpayOrderId: txnId,
                razorpayPaymentId: txnId,
                paidAt: new Date(),
            },
        });
        // Update request state to COMPLETED and unlock downloads
        const updatedRequest = await prisma_js_1.default.documentRequest.update({
            where: { id: requestId },
            data: {
                status: isFinal ? client_1.RequestStatus.COMPLETED : client_1.RequestStatus.IN_PROGRESS,
                ...(isFinal ? { isDownloadUnlocked: true } : {}),
            },
        });
        // Notify chat room via socket
        (0, socket_server_js_1.emitToRequestRoom)(requestId, socketEvents_js_1.default.PAYMENT_CONFIRMED, {
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
exports.PaymentService = PaymentService;
exports.paymentService = new PaymentService();
exports.default = exports.paymentService;
//# sourceMappingURL=payment.service.js.map