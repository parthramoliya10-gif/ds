"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRequestStatusSchema = exports.createRequestSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.createRequestSchema = zod_1.z.object({
    title: zod_1.z
        .string({ required_error: 'Title is required' })
        .min(3, 'Title must be at least 3 characters long')
        .max(150, 'Title cannot exceed 150 characters')
        .trim(),
    description: zod_1.z
        .string({ required_error: 'Description is required' })
        .min(10, 'Description must be at least 10 characters long')
        .max(3000, 'Description cannot exceed 3000 characters')
        .trim(),
    category: zod_1.z.string().max(50).optional().default('General Document'),
    priority: zod_1.z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
});
exports.updateRequestStatusSchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(client_1.RequestStatus, {
        errorMap: () => ({
            message: 'Invalid status. Allowed values: PENDING, QUOTED, IN_PROGRESS, DOCUMENT_UPLOADED, COMPLETED, CANCELLED',
        }),
    }),
});
//# sourceMappingURL=request.validation.js.map