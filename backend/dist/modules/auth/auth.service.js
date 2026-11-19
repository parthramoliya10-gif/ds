"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const client_1 = require("@prisma/client");
const prisma_js_1 = __importDefault(require("../../config/prisma.js"));
const env_js_1 = __importDefault(require("../../config/env.js"));
const supabase_js_1 = require("../../config/supabase.js");
const apiError_js_1 = require("../../utils/apiError.js");
class AuthService {
    /**
     * Internal helper: Sync Supabase Auth user with separate admins / users tables
     */
    async ensureProfileSynced(authUser) {
        const meta = authUser.user_metadata || {};
        // 1. Check Admins table first
        const existingAdmin = await prisma_js_1.default.admin.findUnique({
            where: { id: authUser.id },
        });
        if (existingAdmin) {
            if (!existingAdmin.isActive) {
                throw new apiError_js_1.ApiError(403, 'Admin account has been deactivated. Contact super admin.');
            }
            const updatedAdmin = await prisma_js_1.default.admin.update({
                where: { id: authUser.id },
                data: {
                    email: authUser.email || existingAdmin.email,
                    fullName: meta.full_name || meta.name || existingAdmin.fullName,
                    avatarUrl: meta.avatar_url || meta.picture || existingAdmin.avatarUrl,
                },
            });
            return {
                ...updatedAdmin,
                role: client_1.Role.ADMIN,
                isBlocked: !updatedAdmin.isActive,
            };
        }
        // 2. Otherwise upsert into Users table
        const user = await prisma_js_1.default.user.upsert({
            where: { id: authUser.id },
            update: {
                email: authUser.email || undefined,
                fullName: meta.full_name || meta.name || undefined,
                avatarUrl: meta.avatar_url || meta.picture || undefined,
            },
            create: {
                id: authUser.id,
                email: authUser.email || '',
                fullName: meta.full_name || meta.name || null,
                avatarUrl: meta.avatar_url || meta.picture || null,
                isBlocked: false,
            },
        });
        if (user.isBlocked) {
            throw new apiError_js_1.ApiError(403, 'Your account has been suspended. Please contact support.');
        }
        return {
            ...user,
            role: client_1.Role.USER,
        };
    }
    /**
     * 1. Generate Google OAuth Login URL via Supabase Auth
     */
    async getGoogleOAuthUrl(redirectTo) {
        const callbackUrl = redirectTo || `${env_js_1.default.CLIENT_URL}/auth/callback`;
        const { data, error } = await supabase_js_1.supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: callbackUrl,
                skipBrowserRedirect: true,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            },
        });
        if (error || !data?.url) {
            throw new apiError_js_1.ApiError(500, error?.message || 'Failed to generate Google OAuth URL.');
        }
        return {
            url: data.url,
            provider: 'google',
            redirectTo: callbackUrl,
        };
    }
    /**
     * 2. Establish HttpOnly Session after Google OAuth Callback (Code or Tokens)
     */
    async establishSession(params) {
        let accessToken = params.accessToken;
        let refreshToken = params.refreshToken;
        let authUser;
        if (params.code) {
            const { data, error } = await supabase_js_1.supabaseClient.auth.exchangeCodeForSession(params.code);
            if (error || !data.session || !data.user) {
                throw new apiError_js_1.ApiError(401, error?.message || 'Invalid or expired OAuth code.');
            }
            accessToken = data.session.access_token;
            refreshToken = data.session.refresh_token;
            authUser = data.user;
        }
        else if (accessToken) {
            const { data, error } = await supabase_js_1.supabaseAdmin.auth.getUser(accessToken);
            if (error || !data.user) {
                throw new apiError_js_1.ApiError(401, error?.message || 'Invalid or expired access token.');
            }
            authUser = data.user;
        }
        else {
            throw new apiError_js_1.ApiError(400, 'OAuth code or accessToken is required.');
        }
        const profile = await this.ensureProfileSynced(authUser);
        await prisma_js_1.default.auditLog.create({
            data: {
                actorId: profile.id,
                actorRole: profile.role,
                ...(profile.role === client_1.Role.ADMIN
                    ? { adminActorId: profile.id }
                    : { userActorId: profile.id }),
                action: 'USER_OAUTH_LOGIN',
                metadata: { provider: authUser.app_metadata?.provider || 'google' },
            },
        });
        return {
            profile,
            session: {
                accessToken: accessToken,
                refreshToken: refreshToken || '',
            },
        };
    }
    /**
     * 3. Send Email OTP via Supabase Auth
     */
    async sendEmailOtp(email, fullName) {
        const { error } = await supabase_js_1.supabaseClient.auth.signInWithOtp({
            email,
            options: {
                shouldCreateUser: true,
                data: fullName ? { full_name: fullName } : undefined,
            },
        });
        if (error) {
            throw new apiError_js_1.ApiError(400, error.message);
        }
        return {
            email,
            message: 'OTP sent to your email address. Please check your inbox.',
        };
    }
    /**
     * 4. Verify Email OTP and create authenticated session
     */
    async verifyEmailOtp(email, token) {
        const { data, error } = await supabase_js_1.supabaseClient.auth.verifyOtp({
            email,
            token,
            type: 'email',
        });
        if (error || !data.session || !data.user) {
            throw new apiError_js_1.ApiError(401, error?.message || 'Invalid or expired OTP.');
        }
        const profile = await this.ensureProfileSynced(data.user);
        await prisma_js_1.default.auditLog.create({
            data: {
                actorId: profile.id,
                actorRole: profile.role,
                ...(profile.role === client_1.Role.ADMIN
                    ? { adminActorId: profile.id }
                    : { userActorId: profile.id }),
                action: 'USER_OTP_VERIFIED',
            },
        });
        return {
            profile,
            session: {
                accessToken: data.session.access_token,
                refreshToken: data.session.refresh_token,
            },
        };
    }
    /**
     * 5. Register with Email & Password (triggers email confirmation / OTP)
     */
    async registerWithEmail(email, password, fullName) {
        const { data, error } = await supabase_js_1.supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName },
                emailRedirectTo: `${env_js_1.default.CLIENT_URL}/auth/callback`,
            },
        });
        if (error) {
            throw new apiError_js_1.ApiError(400, error.message);
        }
        let profile = null;
        if (data.user) {
            profile = await this.ensureProfileSynced(data.user);
        }
        return {
            profile,
            emailConfirmationRequired: !data.session,
            session: data.session
                ? {
                    accessToken: data.session.access_token,
                    refreshToken: data.session.refresh_token,
                }
                : null,
        };
    }
    /**
     * 6. Login with Email & Password
     */
    async loginWithPassword(email, password) {
        const { data, error } = await supabase_js_1.supabaseClient.auth.signInWithPassword({
            email,
            password,
        });
        if (error || !data.session || !data.user) {
            throw new apiError_js_1.ApiError(401, error?.message || 'Invalid email or password.');
        }
        const profile = await this.ensureProfileSynced(data.user);
        await prisma_js_1.default.auditLog.create({
            data: {
                actorId: profile.id,
                actorRole: profile.role,
                ...(profile.role === client_1.Role.ADMIN
                    ? { adminActorId: profile.id }
                    : { userActorId: profile.id }),
                action: 'USER_EMAIL_LOGIN',
            },
        });
        return {
            profile,
            session: {
                accessToken: data.session.access_token,
                refreshToken: data.session.refresh_token,
            },
        };
    }
    /**
     * 7. Forgot Password (sends email reset link via Supabase)
     */
    async forgotPassword(email, redirectTo) {
        const resetRedirect = redirectTo || `${env_js_1.default.CLIENT_URL}/reset-password`;
        const { error } = await supabase_js_1.supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: resetRedirect,
        });
        if (error) {
            throw new apiError_js_1.ApiError(400, error.message);
        }
        return {
            message: 'If an account exists with this email, a password reset link has been sent.',
        };
    }
    /**
     * 8. Refresh expired Access Token using HttpOnly refresh token
     */
    async refreshSession(refreshToken) {
        const { data, error } = await supabase_js_1.supabaseClient.auth.refreshSession({
            refresh_token: refreshToken,
        });
        if (error || !data.session || !data.user) {
            throw new apiError_js_1.ApiError(401, 'Session expired. Please log in again.');
        }
        const profile = await this.ensureProfileSynced(data.user);
        return {
            profile,
            session: {
                accessToken: data.session.access_token,
                refreshToken: data.session.refresh_token,
            },
        };
    }
    /**
     * Fetch current authenticated user or admin profile from its dedicated table
     */
    async getProfile(userId, role) {
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
            return { ...admin, role: client_1.Role.ADMIN };
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
        return { ...user, role: client_1.Role.USER };
    }
    /**
     * Update profile fields (Full name, phone, avatar) in dedicated Admin or User table
     */
    async updateProfile(userId, role, data) {
        const updatePayload = {
            ...(data.fullName !== undefined && { fullName: data.fullName }),
            ...(data.phone !== undefined && { phone: data.phone }),
            ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
        };
        if (role === client_1.Role.ADMIN) {
            const updated = await prisma_js_1.default.admin.update({
                where: { id: userId },
                data: updatePayload,
            });
            return { ...updated, role: client_1.Role.ADMIN };
        }
        const updated = await prisma_js_1.default.user.update({
            where: { id: userId },
            data: updatePayload,
        });
        return { ...updated, role: client_1.Role.USER };
    }
    /**
     * Admin-only: Promote User into Admins table OR Demote Admin into Users table
     */
    async updateUserRole(adminId, targetUserId, newRole) {
        if (adminId === targetUserId) {
            throw new apiError_js_1.ApiError(400, 'Admins cannot change their own role.');
        }
        if (newRole === client_1.Role.ADMIN) {
            const existingUser = await prisma_js_1.default.user.findUnique({ where: { id: targetUserId } });
            if (!existingUser) {
                throw new apiError_js_1.ApiError(404, 'Target user not found in users table.');
            }
            const promotedAdmin = await prisma_js_1.default.admin.upsert({
                where: { id: targetUserId },
                update: {
                    isActive: true,
                    email: existingUser.email,
                    fullName: existingUser.fullName,
                    phone: existingUser.phone,
                    avatarUrl: existingUser.avatarUrl,
                },
                create: {
                    id: existingUser.id,
                    email: existingUser.email,
                    fullName: existingUser.fullName,
                    phone: existingUser.phone,
                    avatarUrl: existingUser.avatarUrl,
                    isActive: true,
                },
            });
            await prisma_js_1.default.auditLog.create({
                data: {
                    actorId: adminId,
                    actorRole: client_1.Role.ADMIN,
                    adminActorId: adminId,
                    action: 'ADMIN_ROLE_PROMOTED',
                    metadata: { targetUserId, newRole },
                },
            });
            return { ...promotedAdmin, role: client_1.Role.ADMIN };
        }
        else {
            const existingAdmin = await prisma_js_1.default.admin.findUnique({ where: { id: targetUserId } });
            if (!existingAdmin) {
                throw new apiError_js_1.ApiError(404, 'Target admin not found in admins table.');
            }
            const demotedUser = await prisma_js_1.default.$transaction(async (tx) => {
                await tx.admin.delete({ where: { id: targetUserId } });
                return tx.user.upsert({
                    where: { id: targetUserId },
                    update: { email: existingAdmin.email },
                    create: {
                        id: existingAdmin.id,
                        email: existingAdmin.email,
                        fullName: existingAdmin.fullName,
                        phone: existingAdmin.phone,
                        avatarUrl: existingAdmin.avatarUrl,
                        isBlocked: false,
                    },
                });
            });
            await prisma_js_1.default.auditLog.create({
                data: {
                    actorId: adminId,
                    actorRole: client_1.Role.ADMIN,
                    adminActorId: adminId,
                    action: 'ADMIN_ROLE_DEMOTED',
                    metadata: { targetUserId, newRole },
                },
            });
            return { ...demotedUser, role: client_1.Role.USER };
        }
    }
    /**
     * Admin-only: Block or unblock a user in the Users table
     */
    async updateUserStatus(adminId, targetUserId, isBlocked) {
        if (adminId === targetUserId) {
            throw new apiError_js_1.ApiError(400, 'Admins cannot block themselves.');
        }
        const updated = await prisma_js_1.default.user.update({
            where: { id: targetUserId },
            data: { isBlocked },
        });
        await prisma_js_1.default.auditLog.create({
            data: {
                actorId: adminId,
                actorRole: client_1.Role.ADMIN,
                adminActorId: adminId,
                action: isBlocked ? 'ADMIN_USER_BLOCKED' : 'ADMIN_USER_UNBLOCKED',
                metadata: {
                    targetUserId,
                    isBlocked,
                },
            },
        });
        return { ...updated, role: client_1.Role.USER };
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
exports.default = exports.authService;
//# sourceMappingURL=auth.service.js.map