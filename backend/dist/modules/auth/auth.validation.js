"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStatusSchema = exports.updateRoleSchema = exports.updateProfileSchema = exports.establishSessionSchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.loginSchema = exports.registerSchema = exports.verifyOtpSchema = exports.sendOtpSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.sendOtpSchema = zod_1.z.object({
    email: zod_1.z.string().email('Please provide a valid email address'),
    fullName: zod_1.z.string().min(2).max(100).optional(),
});
exports.verifyOtpSchema = zod_1.z.object({
    email: zod_1.z.string().email('Please provide a valid email address'),
    token: zod_1.z
        .string()
        .min(6, 'OTP must be at least 6 digits')
        .max(10, 'Invalid OTP format'),
});
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email('Please provide a valid email address'),
    password: zod_1.z
        .string()
        .min(8, 'Password must be at least 8 characters long')
        .regex(/[A-Z]/, 'Password must contain at least one capital letter (A-Z)')
        .regex(/[0-9]/, 'Password must contain at least one number (0-9)')
        .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
        .max(128),
    fullName: zod_1.z.string().min(2, 'Full name must be at least 2 characters').max(100),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Please provide a valid email address'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
exports.forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email('Please provide a valid email address'),
    redirectTo: zod_1.z.string().url().optional(),
});
exports.resetPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email('Please provide a valid email address'),
    token: zod_1.z
        .string()
        .min(6, 'OTP must be at least 6 digits')
        .max(10, 'Invalid OTP format'),
    password: zod_1.z
        .string()
        .min(6, 'New password must be at least 6 characters long')
        .max(128),
});
exports.establishSessionSchema = zod_1.z
    .object({
    code: zod_1.z.string().min(1).optional(),
    accessToken: zod_1.z.string().min(1).optional(),
    refreshToken: zod_1.z.string().min(1).optional(),
})
    .refine((data) => Boolean(data.code || data.accessToken), {
    message: 'Either OAuth code or accessToken is required',
});
exports.updateProfileSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(2, 'Full name must be at least 2 characters').max(100).optional(),
    phone: zod_1.z.string().min(7, 'Invalid phone number').max(20).optional(),
    avatarUrl: zod_1.z.union([zod_1.z.string().url('Avatar must be a valid URL'), zod_1.z.literal(''), zod_1.z.null()]).optional(),
});
exports.updateRoleSchema = zod_1.z.object({
    role: zod_1.z.nativeEnum(client_1.Role, {
        errorMap: () => ({ message: 'Role must be either ADMIN or USER' }),
    }),
});
exports.updateStatusSchema = zod_1.z.object({
    isBlocked: zod_1.z.boolean({
        required_error: 'isBlocked status is required',
    }),
});
//# sourceMappingURL=auth.validation.js.map