"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFinalDocumentSchema = void 0;
const zod_1 = require("zod");
exports.uploadFinalDocumentSchema = zod_1.z.object({
    title: zod_1.z
        .string({ required_error: 'Document title is required' })
        .min(3, 'Title must be at least 3 characters long')
        .max(150, 'Title cannot exceed 150 characters')
        .trim(),
});
//# sourceMappingURL=document.validation.js.map