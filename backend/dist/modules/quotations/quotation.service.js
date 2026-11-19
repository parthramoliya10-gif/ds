"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.quotationService = exports.QuotationService = void 0;
const client_1 = require("@prisma/client");
const prisma_js_1 = __importDefault(require("../../config/prisma.js"));
const apiError_js_1 = require("../../utils/apiError.js");
const razorpay_js_1 = __importDefault(require("../../config/razorpay.js"));
const env_js_1 = __importDefault(require("../../config/env.js"));
const socket_server_js_1 = require("../../sockets/socket.server.js");
const socketEvents_js_1 = __importDefault(require("../../constants/socketEvents.js"));
class QuotationService {
    /**
     * Admin-only: Create and send a new quotation
     */
    async createQuotation(adminId, data) {
        // 1. Verify request exists
        const request = await prisma_js_1.default.documentRequest.findUnique({
            where: { id: data.requestId },
            include: { conversation: true },
        });
        if (!request) {
            throw new apiError_js_1.ApiError(404, 'Document request not found.');
        }
        if (request.status === client_1.RequestStatus.IN_PROGRESS ||
            request.status === client_1.RequestStatus.DOCUMENT_UPLOADED ||
            request.status === client_1.RequestStatus.COMPLETED ||
            request.status === client_1.RequestStatus.CANCELLED) {
            throw new apiError_js_1.ApiError(400, `Cannot create a new quotation while request is in '${request.status}' status.`);
        }
        // 2. Strict integer math in cents (zero floating-point precision error)
        const totalAmountCents = Math.round(data.totalAmount * 100);
        const advanceAmountCents = Math.floor(totalAmountCents / 2);
        const remainingAmountCents = totalAmountCents - advanceAmountCents;
        // 3. Count previous quotations for versioning
        const previousQuotationsCount = await prisma_js_1.default.quotation.count({
            where: { requestId: data.requestId },
        });
        const version = previousQuotationsCount + 1;
        // 4. Atomic transaction: Expire previous, create new, update request, inject Quotation Card into Chat
        const newQuotation = await prisma_js_1.default.$transaction(async (tx) => {
            // Mark any previous active quotation as EXPIRED
            await tx.quotation.updateMany({
                where: {
                    requestId: data.requestId,
                    status: client_1.QuotationStatus.SENT,
                },
                data: { status: client_1.QuotationStatus.EXPIRED },
            });
            // Create new quotation record
            const quotation = await tx.quotation.create({
                data: {
                    requestId: data.requestId,
                    createdByAdminId: adminId,
                    version,
                    totalAmount: totalAmountCents,
                    advanceAmount: advanceAmountCents,
                    remainingAmount: remainingAmountCents,
                    currency: 'USD',
                    terms: data.terms,
                    estimatedDays: data.estimatedDays,
                    status: client_1.QuotationStatus.SENT,
                },
            });
            // Update Request status to QUOTED
            await tx.documentRequest.update({
                where: { id: data.requestId },
                data: { status: client_1.RequestStatus.QUOTED },
            });
            // Automatically post Interactive Quotation Card in the real-time chat
            let quotationCardMessage = null;
            if (request.conversation) {
                quotationCardMessage = await tx.message.create({
                    data: {
                        conversationId: request.conversation.id,
                        senderId: adminId,
                        senderRole: client_1.Role.ADMIN,
                        adminSenderId: adminId,
                        messageType: client_1.MessageType.QUOTATION_CARD,
                        content: `Quotation (v${version}): $${(totalAmountCents / 100).toFixed(2)} (50% Advance: $${(advanceAmountCents / 100).toFixed(2)}, 50% Final: $${(remainingAmountCents / 100).toFixed(2)})`,
                        metadata: {
                            quotationId: quotation.id,
                            version: quotation.version,
                            totalAmount: totalAmountCents,
                            advanceAmount: advanceAmountCents,
                            remainingAmount: remainingAmountCents,
                            currency: 'USD',
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
                    actorRole: client_1.Role.ADMIN,
                    adminActorId: adminId,
                    requestId: data.requestId,
                    action: 'QUOTATION_SENT',
                    metadata: {
                        quotationId: quotation.id,
                        version,
                        totalAmount: totalAmountCents,
                        currency: 'USD',
                    },
                },
            });
            return { quotation, quotationCardMessage };
        }, {
            maxWait: 15000,
            timeout: 20000,
        });
        if (newQuotation.quotationCardMessage) {
            (0, socket_server_js_1.emitToRequestRoom)(data.requestId, socketEvents_js_1.default.NEW_MESSAGE, newQuotation.quotationCardMessage);
        }
        (0, socket_server_js_1.emitToRequestRoom)(data.requestId, socketEvents_js_1.default.QUOTATION_RECEIVED, newQuotation.quotation);
        return newQuotation.quotation;
    }
    /**
     * Get all quotation versions for a request with ownership guard
     */
    async getQuotationsForRequest(requestId, user) {
        const request = await prisma_js_1.default.documentRequest.findUnique({
            where: { id: requestId },
            select: { userId: true },
        });
        if (!request) {
            throw new apiError_js_1.ApiError(404, 'Document request not found.');
        }
        if (user.role !== client_1.Role.ADMIN && request.userId !== user.id) {
            throw new apiError_js_1.ApiError(403, 'Forbidden: You do not have access to quotations for this request.');
        }
        const quotations = await prisma_js_1.default.quotation.findMany({
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
    async acceptQuotation(userId, quotationId) {
        const quotation = await prisma_js_1.default.quotation.findUnique({
            where: { id: quotationId },
            include: {
                request: {
                    include: { conversation: true },
                },
            },
        });
        if (!quotation) {
            throw new apiError_js_1.ApiError(404, 'Quotation not found.');
        }
        if (quotation.request.userId !== userId) {
            throw new apiError_js_1.ApiError(403, 'Forbidden: You can only accept quotations for your own requests.');
        }
        if (quotation.status !== client_1.QuotationStatus.SENT) {
            throw new apiError_js_1.ApiError(400, `Cannot accept quotation in '${quotation.status}' status.`);
        }
        // 1. Generate Razorpay Order for Milestone 1 (50% Advance) FIRST so DB isn't mutated on gateway error
        const currency = quotation.currency || 'USD';
        const receipt = `rcpt_adv_${quotation.id.slice(0, 8)}_${Date.now()}`.slice(0, 40);
        const razorpayOrder = await razorpay_js_1.default.orders.create({
            amount: quotation.advanceAmount,
            currency,
            receipt,
            notes: {
                requestId: quotation.requestId,
                quotationId: quotation.id,
                milestone: 'ADVANCE_50',
                userId,
            },
        });
        // 2. Atomically mark quotation ACCEPTED, save Payment record, post Chat message & Audit Log
        const { acceptedQuotation, payment, systemMessage } = await prisma_js_1.default.$transaction(async (tx) => {
            const accepted = await tx.quotation.update({
                where: { id: quotationId },
                data: { status: client_1.QuotationStatus.ACCEPTED },
            });
            const pay = await tx.payment.create({
                data: {
                    userId,
                    requestId: quotation.requestId,
                    quotationId: quotation.id,
                    milestone: 'ADVANCE_50',
                    amount: quotation.advanceAmount,
                    currency,
                    status: 'PENDING',
                    razorpayOrderId: razorpayOrder.id,
                },
            });
            let msg = null;
            if (quotation.request.conversation) {
                msg = await tx.message.create({
                    data: {
                        conversationId: quotation.request.conversation.id,
                        senderId: userId,
                        senderRole: client_1.Role.USER,
                        userSenderId: userId,
                        messageType: client_1.MessageType.SYSTEM,
                        content: `Quotation (v${quotation.version}) accepted by user. 50% Advance payment initiated ($${(quotation.advanceAmount / 100).toFixed(2)}).`,
                    },
                });
            }
            await tx.auditLog.create({
                data: {
                    actorId: userId,
                    actorRole: client_1.Role.USER,
                    userActorId: userId,
                    requestId: quotation.requestId,
                    action: 'QUOTATION_ACCEPTED',
                    metadata: {
                        quotationId: quotation.id,
                        advanceOrderId: razorpayOrder.id,
                    },
                },
            });
            return { acceptedQuotation: accepted, payment: pay, systemMessage: msg };
        }, { maxWait: 15000, timeout: 20000 });
        if (systemMessage) {
            (0, socket_server_js_1.emitToRequestRoom)(quotation.requestId, socketEvents_js_1.default.NEW_MESSAGE, systemMessage);
        }
        return {
            quotation: acceptedQuotation,
            paymentOrder: {
                orderId: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                keyId: env_js_1.default.RAZORPAY_KEY_ID,
                milestone: 'ADVANCE_50',
                paymentRecordId: payment.id,
            },
        };
    }
    /**
     * User rejects a quotation
     */
    async rejectQuotation(userId, quotationId, reason) {
        const quotation = await prisma_js_1.default.quotation.findUnique({
            where: { id: quotationId },
            include: {
                request: {
                    include: { conversation: true },
                },
            },
        });
        if (!quotation) {
            throw new apiError_js_1.ApiError(404, 'Quotation not found.');
        }
        if (quotation.request.userId !== userId) {
            throw new apiError_js_1.ApiError(403, 'Forbidden: You can only reject quotations for your own requests.');
        }
        if (quotation.status !== client_1.QuotationStatus.SENT) {
            throw new apiError_js_1.ApiError(400, `Cannot reject quotation in '${quotation.status}' status.`);
        }
        const rejectedQuotation = await prisma_js_1.default.quotation.update({
            where: { id: quotationId },
            data: { status: client_1.QuotationStatus.REJECTED },
        });
        // Post notification in chat
        if (quotation.request.conversation) {
            await prisma_js_1.default.message.create({
                data: {
                    conversationId: quotation.request.conversation.id,
                    senderId: userId,
                    senderRole: client_1.Role.USER,
                    userSenderId: userId,
                    messageType: client_1.MessageType.SYSTEM,
                    content: `Quotation (v${quotation.version}) rejected by user.${reason ? ` Reason: ${reason}` : ''}`,
                },
            });
        }
        await prisma_js_1.default.auditLog.create({
            data: {
                actorId: userId,
                actorRole: client_1.Role.USER,
                userActorId: userId,
                requestId: quotation.requestId,
                action: 'QUOTATION_REJECTED',
                metadata: { quotationId: quotation.id, reason },
            },
        });
        return rejectedQuotation;
    }
}
exports.QuotationService = QuotationService;
exports.quotationService = new QuotationService();
exports.default = exports.quotationService;
//# sourceMappingURL=quotation.service.js.map