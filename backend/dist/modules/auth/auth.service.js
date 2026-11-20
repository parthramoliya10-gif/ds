"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const prisma_js_1 = __importDefault(require("../../config/prisma.js"));
const env_js_1 = __importDefault(require("../../config/env.js"));
const supabase_js_1 = require("../../config/supabase.js");
const apiError_js_1 = require("../../utils/apiError.js");
const otp_store_js_1 = __importDefault(require("./otp.store.js"));
const email_js_1 = require("../../utils/email.js");
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
     * Internal helper: Generate a valid signed JWT for session
     */
    generateCustomJwtToken(authUser) {
        const payload = {
            sub: authUser.id,
            email: authUser.email,
            role: 'authenticated',
            aud: 'authenticated',
            iss: env_js_1.default.SUPABASE_URL ? `${env_js_1.default.SUPABASE_URL}/auth/v1` : 'dsms',
        };
        return jsonwebtoken_1.default.sign(payload, env_js_1.default.SUPABASE_JWT_SECRET, { expiresIn: '7d' });
    }
    /**
     * 3. Send Email OTP (Custom 6-digit code via Resend)
     */
    async sendEmailOtp(email, fullName) {
        const normalizedEmail = email.trim().toLowerCase();
        // Generate cryptographic 6-digit OTP stored in memory with 10-minute TTL
        const { code, expiresAt } = otp_store_js_1.default.createOtp(normalizedEmail, 'LOGIN', {
            email: normalizedEmail,
            fullName,
        });
        // Dispatch branded DSMS verification email
        await (0, email_js_1.sendOtpEmail)({
            to: normalizedEmail,
            otp: code,
            fullName,
            type: 'LOGIN',
        });
        return {
            email: normalizedEmail,
            expiresAt,
            message: 'A 6-digit verification code has been sent to your email address.',
        };
    }
    /**
     * 4. Verify Email OTP and create authenticated session
     */
    async verifyEmailOtp(email, token) {
        const normalizedEmail = email.trim().toLowerCase();
        // Verify token against OtpStore (checks SIGNUP first, then LOGIN)
        let verification;
        try {
            verification = otp_store_js_1.default.verifyOtp(normalizedEmail, token, 'SIGNUP');
        }
        catch (err) {
            try {
                verification = otp_store_js_1.default.verifyOtp(normalizedEmail, token, 'LOGIN');
            }
            catch {
                throw err;
            }
        }
        const regData = verification.data || {};
        let authUser;
        // Check if user already exists in Supabase Auth
        const { data: existingAuthUsers } = await supabase_js_1.supabaseAdmin.auth.admin.listUsers();
        const foundUser = existingAuthUsers?.users.find((u) => u.email?.toLowerCase() === normalizedEmail);
        if (!foundUser) {
            // Create confirmed user in Supabase Auth via Admin API
            const { data: newUser, error: createErr } = await supabase_js_1.supabaseAdmin.auth.admin.createUser({
                email: normalizedEmail,
                password: regData.password || crypto_1.default.randomBytes(16).toString('hex'),
                email_confirm: true,
                user_metadata: {
                    full_name: regData.fullName || 'User',
                },
            });
            if (createErr || !newUser?.user) {
                throw new apiError_js_1.ApiError(500, createErr?.message || 'Failed to create authenticated account.');
            }
            authUser = newUser.user;
        }
        else {
            if (!foundUser.email_confirmed_at) {
                await supabase_js_1.supabaseAdmin.auth.admin.updateUserById(foundUser.id, {
                    email_confirm: true,
                });
            }
            authUser = foundUser;
        }
        // Ensure user record is synced into PostgreSQL users / admins table
        const profile = await this.ensureProfileSynced(authUser);
        // Generate Session Tokens
        let accessToken;
        let refreshToken = '';
        if (regData.password) {
            const { data: signInRes } = await supabase_js_1.supabaseClient.auth.signInWithPassword({
                email: normalizedEmail,
                password: regData.password,
            });
            if (signInRes?.session) {
                accessToken = signInRes.session.access_token;
                refreshToken = signInRes.session.refresh_token;
            }
            else {
                accessToken = this.generateCustomJwtToken(authUser);
            }
        }
        else {
            accessToken = this.generateCustomJwtToken(authUser);
        }
        await prisma_js_1.default.auditLog.create({
            data: {
                actorId: profile.id,
                actorRole: profile.role,
                ...(profile.role === client_1.Role.ADMIN
                    ? { adminActorId: profile.id }
                    : { userActorId: profile.id }),
                action: 'USER_OTP_VERIFIED',
                metadata: { email: normalizedEmail },
            },
        });
        return {
            profile,
            session: {
                accessToken,
                refreshToken,
            },
        };
    }
    /**
     * 5. Register with Email & Password (generates custom 6-digit OTP & sends branded Resend email)
     */
    async registerWithEmail(email, password, fullName) {
        const normalizedEmail = email.trim().toLowerCase();
        // Check if user already exists in PostgreSQL
        const existingUser = await prisma_js_1.default.user.findUnique({ where: { email: normalizedEmail } });
        const existingAdmin = await prisma_js_1.default.admin.findUnique({ where: { email: normalizedEmail } });
        if (existingUser || existingAdmin) {
            throw new apiError_js_1.ApiError(409, 'An account with this email address already exists. Please log in.');
        }
        // Generate cryptographic 6-digit OTP stored in memory with 10-minute TTL
        const { code, expiresAt } = otp_store_js_1.default.createOtp(normalizedEmail, 'SIGNUP', {
            email: normalizedEmail,
            password,
            fullName,
        });
        // Dispatch branded DSMS verification email via Resend
        await (0, email_js_1.sendOtpEmail)({
            to: normalizedEmail,
            otp: code,
            fullName,
            type: 'SIGNUP',
        });
        return {
            email: normalizedEmail,
            emailConfirmationRequired: true,
            expiresAt,
            message: 'A 6-digit verification code has been sent to your email address.',
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