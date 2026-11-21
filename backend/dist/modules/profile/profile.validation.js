"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordSchema = exports.updateProfileSchema = void 0;
const zod_1 = require("zod");
const notificationPreferencesSchema = zod_1.z
    .object({
    emailNotifications: zod_1.z.boolean().optional(),
    chatNotifications: zod_1.z.boolean().optional(),
    paymentAlerts: zod_1.z.boolean().optional(),
    documentAlerts: zod_1.z.boolean().optional(),
})
    .strict();
exports.updateProfileSchema = zod_1.z.object({
    // Shared fields (User & Admin)
    fullName: zod_1.z.string().trim().min(2, 'Full name must be at least 2 characters').max(100).optional(),
    phone: zod_1.z.string().trim().min(7, 'Invalid phone number').max(25).nullable().optional(),
    avatarUrl: zod_1.z.string().url('Avatar must be a valid URL').nullable().optional(),
    bio: zod_1.z.string().trim().max(1000, 'Bio cannot exceed 1000 characters').nullable().optional(),
    country: zod_1.z.string().trim().max(80).nullable().optional(),
    city: zod_1.z.string().trim().max(80).nullable().optional(),
    timezone: zod_1.z.string().trim().max(60).optional(),
    notificationPreferences: notificationPreferencesSchema.optional(),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
    // User-specific fields (ignored for Admins)
    organization: zod_1.z.string().trim().max(150).nullable().optional(),
    address: zod_1.z.string().trim().max(500).nullable().optional(),
    // Admin-specific fields (ignored for Users — enforced in service)
    department: zod_1.z.string().trim().max(100).nullable().optional(),
    designation: zod_1.z.string().trim().max(100).nullable().optional(),
    specializations: zod_1.z.array(zod_1.z.string().trim().min(1).max(60)).max(20).optional(),
});
exports.changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string({ required_error: 'Current password is required' }).min(1, 'Current password is required'),
    newPassword: zod_1.z
        .string({ required_error: 'New password is required' })
        .min(8, 'New password must be at least 8 characters long')
        .max(128, 'Password cannot exceed 128 characters'),
});
//# sourceMappingURL=profile.validation.js.map