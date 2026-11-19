"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPaymentSchema = exports.createOrderSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.createOrderSchema = zod_1.z.object({
    requestId: zod_1.z.string().uuid('Invalid request ID format'),
    milestone: zod_1.z.nativeEnum(client_1.PaymentMilestone, {
        errorMap: () => ({ message: 'Milestone must be either ADVANCE_50 or FINAL_50' }),
    }),
});
exports.verifyPaymentSchema = zod_1.z.object({
    razorpayOrderId: zod_1.z.string().min(1, 'razorpayOrderId is required'),
    razorpayPaymentId: zod_1.z.string().min(1, 'razorpayPaymentId is required'),
    razorpaySignature: zod_1.z.string().min(1, 'razorpaySignature is required'),
});
//# sourceMappingURL=payment.validation.js.map