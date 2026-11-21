"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.profileService = exports.ProfileService = void 0;
const client_1 = require("@prisma/client");
const prisma_js_1 = __importDefault(require("../../config/prisma.js"));
const supabase_js_1 = require("../../config/supabase.js");
const apiError_js_1 = require("../../utils/apiError.js");
const cloudinary_js_1 = require("../../utils/cloudinary.js");
const logger_js_1 = __importDefault(require("../../utils/logger.js"));
const calculateCompletionPercent = (fields) => {
    const filled = fields.filter((val) => {
        if (Array.isArray(val))
            return val.length > 0;
        return val !== null && val !== undefined && String(val).trim() !== '';
    }).length;
    return Math.round((filled / fields.length) * 100);
};
class ProfileService {
    /**
     * 1. Get complete profile for logged-in User or Admin
     */
    async getMyProfile(userId, role) {
        if (role === client_1.Role.ADMIN) {
            const admin = await prisma_js_1.default.admin.findUnique({
                where: { id: userId },
                include: {
                    _count: {
                        select: {
                            quotations: true,
                            uploadedDocuments: true,
                        },
                    },
                },
            });
            if (!admin) {
                throw new apiError_js_1.ApiError(404, 'Admin profile not found.');
            }
            const profileCompletion = calculateCompletionPercent([
                admin.fullName,
                admin.phone,
                admin.avatarUrl,
                admin.department,
                admin.designation,
                admin.bio,
                admin.specializations,
                admin.country,
            ]);
            return {
                ...admin,
                role: client_1.Role.ADMIN,
                profileCompletion,
            };
        }
        const user = await prisma_js_1.default.user.findUnique({
            where: { id: userId },
            include: {
                _count: {
                    select: {
                        requests: true,
                        payments: true,
                    },
                },
            },
        });
        if (!user) {
            throw new apiError_js_1.ApiError(404, 'User profile not found.');
        }
        const profileCompletion = calculateCompletionPercent([
            user.fullName,
            user.phone,
            user.avatarUrl,
            user.bio,
            user.organization,
            user.country,
            user.city,
            user.address,
        ]);
        return {
            ...user,
            role: client_1.Role.USER,
            profileCompletion,
        };
    }
    /**
     * 2. Update profile details (role-isolated fields for User vs Admin)
     */
    async updateMyProfile(userId, role, data) {
        if (role === client_1.Role.ADMIN) {
            const adminUpdateData = {
                ...(data.fullName !== undefined && { fullName: data.fullName }),
                ...(data.phone !== undefined && { phone: data.phone }),
                ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
                ...(data.department !== undefined && { department: data.department }),
                ...(data.designation !== undefined && { designation: data.designation }),
                ...(data.bio !== undefined && { bio: data.bio }),
                ...(data.specializations !== undefined && { specializations: data.specializations }),
                ...(data.country !== undefined && { country: data.country }),
                ...(data.city !== undefined && { city: data.city }),
                ...(data.timezone !== undefined && { timezone: data.timezone }),
                ...(data.notificationPreferences !== undefined && {
                    notificationPreferences: data.notificationPreferences,
                }),
                ...(data.metadata !== undefined && { metadata: data.metadata }),
            };
            const updated = await prisma_js_1.default.admin.update({
                where: { id: userId },
                data: adminUpdateData,
            });
            await prisma_js_1.default.auditLog.create({
                data: {
                    actorId: userId,
                    actorRole: client_1.Role.ADMIN,
                    adminActorId: userId,
                    action: 'ADMIN_PROFILE_UPDATED',
                    metadata: { updatedFields: Object.keys(adminUpdateData) },
                },
            });
            // Best-effort sync of fullName to Supabase Auth metadata
            if (data.fullName) {
                supabase_js_1.supabaseAdmin.auth.admin
                    .updateUserById(userId, { user_metadata: { full_name: data.fullName } })
                    .catch((err) => logger_js_1.default.warn('Supabase metadata sync skipped:', err?.message));
            }
            return this.getMyProfile(updated.id, client_1.Role.ADMIN);
        }
        // Regular User profile update
        const userUpdateData = {
            ...(data.fullName !== undefined && { fullName: data.fullName }),
            ...(data.phone !== undefined && { phone: data.phone }),
            ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
            ...(data.bio !== undefined && { bio: data.bio }),
            ...(data.organization !== undefined && { organization: data.organization }),
            ...(data.country !== undefined && { country: data.country }),
            ...(data.city !== undefined && { city: data.city }),
            ...(data.address !== undefined && { address: data.address }),
            ...(data.timezone !== undefined && { timezone: data.timezone }),
            ...(data.notificationPreferences !== undefined && {
                notificationPreferences: data.notificationPreferences,
            }),
            ...(data.metadata !== undefined && { metadata: data.metadata }),
        };
        const updated = await prisma_js_1.default.user.update({
            where: { id: userId },
            data: userUpdateData,
        });
        await prisma_js_1.default.auditLog.create({
            data: {
                actorId: userId,
                actorRole: client_1.Role.USER,
                userActorId: userId,
                action: 'USER_PROFILE_UPDATED',
                metadata: { updatedFields: Object.keys(userUpdateData) },
            },
        });
        if (data.fullName) {
            supabase_js_1.supabaseAdmin.auth.admin
                .updateUserById(userId, { user_metadata: { full_name: data.fullName } })
                .catch((err) => logger_js_1.default.warn('Supabase metadata sync skipped:', err?.message));
        }
        return this.getMyProfile(updated.id, client_1.Role.USER);
    }
    /**
     * 3. Upload & replace profile avatar image via Cloudinary
     */
    async uploadAvatar(userId, role, file) {
        // 1. Fetch existing avatarPublicId so we can clean up old asset
        const existing = role === client_1.Role.ADMIN
            ? await prisma_js_1.default.admin.findUnique({
                where: { id: userId },
                select: { avatarPublicId: true },
            })
            : await prisma_js_1.default.user.findUnique({
                where: { id: userId },
                select: { avatarPublicId: true },
            });
        if (!existing) {
            throw new apiError_js_1.ApiError(404, 'Profile not found.');
        }
        // 2. Upload new avatar to Cloudinary
        const uploadRes = await (0, cloudinary_js_1.uploadBufferToCloudinary)(file.buffer, 'document-system/avatars', {
            resourceType: 'image',
            isPrivate: false,
        });
        // 3. Update DB record
        if (role === client_1.Role.ADMIN) {
            await prisma_js_1.default.admin.update({
                where: { id: userId },
                data: {
                    avatarUrl: uploadRes.secureUrl,
                    avatarPublicId: uploadRes.publicId,
                },
            });
        }
        else {
            await prisma_js_1.default.user.update({
                where: { id: userId },
                data: {
                    avatarUrl: uploadRes.secureUrl,
                    avatarPublicId: uploadRes.publicId,
                },
            });
        }
        // 4. Delete previous avatar from Cloudinary (non-blocking cleanup)
        if (existing.avatarPublicId && existing.avatarPublicId !== uploadRes.publicId) {
            (0, cloudinary_js_1.deleteFromCloudinary)(existing.avatarPublicId, 'image').catch((err) => logger_js_1.default.warn('Old avatar cleanup failed:', err));
        }
        // 5. Best-effort sync to Supabase Auth user_metadata
        supabase_js_1.supabaseAdmin.auth.admin
            .updateUserById(userId, { user_metadata: { avatar_url: uploadRes.secureUrl } })
            .catch((err) => logger_js_1.default.warn('Supabase avatar metadata sync skipped:', err?.message));
        await prisma_js_1.default.auditLog.create({
            data: {
                actorId: userId,
                actorRole: role,
                ...(role === client_1.Role.ADMIN ? { adminActorId: userId } : { userActorId: userId }),
                action: 'PROFILE_AVATAR_UPDATED',
            },
        });
        return {
            avatarUrl: uploadRes.secureUrl,
            avatarPublicId: uploadRes.publicId,
        };
    }
    /**
     * 4. Remove profile avatar and clean up from Cloudinary
     */
    async removeAvatar(userId, role) {
        const existing = role === client_1.Role.ADMIN
            ? await prisma_js_1.default.admin.findUnique({
                where: { id: userId },
                select: { avatarPublicId: true },
            })
            : await prisma_js_1.default.user.findUnique({
                where: { id: userId },
                select: { avatarPublicId: true },
            });
        if (!existing) {
            throw new apiError_js_1.ApiError(404, 'Profile not found.');
        }
        if (existing.avatarPublicId) {
            await (0, cloudinary_js_1.deleteFromCloudinary)(existing.avatarPublicId, 'image');
        }
        if (role === client_1.Role.ADMIN) {
            await prisma_js_1.default.admin.update({
                where: { id: userId },
                data: { avatarUrl: null, avatarPublicId: null },
            });
        }
        else {
            await prisma_js_1.default.user.update({
                where: { id: userId },
                data: { avatarUrl: null, avatarPublicId: null },
            });
        }
        await prisma_js_1.default.auditLog.create({
            data: {
                actorId: userId,
                actorRole: role,
                ...(role === client_1.Role.ADMIN ? { adminActorId: userId } : { userActorId: userId }),
                action: 'PROFILE_AVATAR_REMOVED',
            },
        });
        return { avatarUrl: null };
    }
    /**
     * 5. Change password via Supabase Auth (verifies currentPassword if supplied)
     */
    async changePassword(userId, email, role, params) {
        if (!params.currentPassword) {
            throw new apiError_js_1.ApiError(400, 'Current password is required.');
        }
        const { error: signInError } = await supabase_js_1.supabaseClient.auth.signInWithPassword({
            email,
            password: params.currentPassword,
        });
        if (signInError) {
            throw new apiError_js_1.ApiError(400, 'Current password is incorrect.');
        }
        const { error } = await supabase_js_1.supabaseAdmin.auth.admin.updateUserById(userId, {
            password: params.newPassword,
        });
        if (error) {
            throw new apiError_js_1.ApiError(400, error.message || 'Failed to update password.');
        }
        await prisma_js_1.default.auditLog.create({
            data: {
                actorId: userId,
                actorRole: role,
                ...(role === client_1.Role.ADMIN ? { adminActorId: userId } : { userActorId: userId }),
                action: 'PROFILE_PASSWORD_CHANGED',
            },
        });
        return { message: 'Password updated successfully.' };
    }
}
exports.ProfileService = ProfileService;
exports.profileService = new ProfileService();
exports.default = exports.profileService;
//# sourceMappingURL=profile.service.js.map