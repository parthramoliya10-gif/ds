"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const env_js_1 = __importDefault(require("../config/env.js"));
const prisma_js_1 = __importDefault(require("../config/prisma.js"));
const supabase_js_1 = require("../config/supabase.js");
const apiError_js_1 = require("../utils/apiError.js");
const authenticate = async (req, _res, next) => {
    try {
        let token;
        // 1. Extract token from Authorization Bearer header
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }
        // 2. Or fallback to cookies (HttpOnly session cookie)
        else if (req.cookies) {
            token =
                req.cookies['sb-access-token'] ||
                    req.cookies['access_token'] ||
                    req.cookies['supabase-auth-token'];
        }
        if (!token) {
            throw new apiError_js_1.ApiError(401, 'Authentication token missing. Please log in.');
        }
        let userId;
        let email;
        // 3. Try verifying token signature using SUPABASE_JWT_SECRET
        try {
            const decoded = jsonwebtoken_1.default.verify(token, env_js_1.default.SUPABASE_JWT_SECRET);
            userId = decoded.sub;
            email = decoded.email;
        }
        catch (jwtErr) {
            // Fallback to Supabase Admin Auth API
            const { data: authUser, error: authError } = await supabase_js_1.supabaseAdmin.auth.getUser(token);
            if (authError || !authUser?.user) {
                throw new apiError_js_1.ApiError(401, 'Invalid or expired session. Please log in again.');
            }
            userId = authUser.user.id;
            email = authUser.user.email;
        }
        if (!userId) {
            throw new apiError_js_1.ApiError(401, 'Invalid token payload: user identifier missing.');
        }
        // 4. First check separate Admins table
        const admin = await prisma_js_1.default.admin.findUnique({
            where: { id: userId },
        });
        if (admin) {
            if (!admin.isActive) {
                throw new apiError_js_1.ApiError(403, 'Admin account has been deactivated. Contact super admin.');
            }
            req.user = {
                id: admin.id,
                email: admin.email,
                role: client_1.Role.ADMIN,
                fullName: admin.fullName,
                avatarUrl: admin.avatarUrl,
                isBlocked: !admin.isActive,
            };
            return next();
        }
        // 5. Otherwise check separate Users table
        let user = await prisma_js_1.default.user.findUnique({
            where: { id: userId },
        });
        // Failsafe: If user record doesn't exist yet, fetch details from Supabase Auth and create in users table
        if (!user) {
            const { data: authUser } = await supabase_js_1.supabaseAdmin.auth.admin.getUserById(userId);
            const userMeta = authUser?.user?.user_metadata || {};
            user = await prisma_js_1.default.user.create({
                data: {
                    id: userId,
                    email: email || authUser?.user?.email || '',
                    fullName: userMeta.full_name || userMeta.name || null,
                    avatarUrl: userMeta.avatar_url || userMeta.picture || null,
                    isBlocked: false,
                },
            });
        }
        // 6. Check if user is blocked by admin
        if (user.isBlocked) {
            throw new apiError_js_1.ApiError(403, 'Your account has been suspended. Please contact support.');
        }
        // 7. Attach authenticated user to Express request
        req.user = {
            id: user.id,
            email: user.email,
            role: client_1.Role.USER,
            fullName: user.fullName,
            avatarUrl: user.avatarUrl,
            isBlocked: user.isBlocked,
        };
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.authenticate = authenticate;
//# sourceMappingURL=auth.middleware.js.map