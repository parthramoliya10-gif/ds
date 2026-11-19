"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectQuotationSchema = exports.createQuotationSchema = void 0;
const zod_1 = require("zod");
exports.createQuotationSchema = zod_1.z.object({
    requestId: zod_1.z.string().uuid('Invalid request ID format'),
    totalAmount: zod_1.z
        .number({ required_error: 'Total amount is required' })
        .positive('Total amount must be greater than zero')
        .min(1, 'Minimum amount is $1'),
    terms: zod_1.z.string().max(2000).optional(),
    estimatedDays: zod_1.z
        .number()
        .int('Days must be a whole number')
        .positive('Estimated days must be positive')
        .max(365, 'Estimated days cannot exceed 365')
        .optional(),
});
exports.rejectQuotationSchema = zod_1.z.object({
    reason: zod_1.z.string().max(500).optional(),
});
//# sourceMappingURL=quotation.validation.js.map