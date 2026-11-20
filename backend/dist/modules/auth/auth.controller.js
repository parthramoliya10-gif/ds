"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.AuthController = void 0;
const auth_service_js_1 = __importDefault(require("./auth.service.js"));
const profile_service_js_1 = __importDefault(require("../profile/profile.service.js"));
const env_js_1 = __importDefault(require("../../config/env.js"));
const apiResponse_js_1 = require("../../utils/apiResponse.js");
const apiError_js_1 = require("../../utils/apiError.js");
const isProd = env_js_1.default.NODE_ENV === 'production';
const setAuthCookies = (res, accessToken, refreshToken) => {
    res.cookie('sb-access-token', accessToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'strict' : 'lax',
        maxAge: 60 * 60 * 1000, // 1 hour
        path: '/',
    });
    if (refreshToken) {
        res.cookie('sb-refresh-token', refreshToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? 'strict' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/',
        });
    }
};
const clearAuthCookies = (res) => {
    const cookieOpts = {
        httpOnly: true,
        secure: isProd,
        sameSite: (isProd ? 'strict' : 'lax'),
        path: '/',
    };
    res.clearCookie('sb-access-token', cookieOpts);
    res.clearCookie('sb-refresh-token', cookieOpts);
    res.clearCookie('access_token', cookieOpts);
};
class AuthController {
    /**
     * GET /api/v1/auth/google
     * Returns Google OAuth URL (or redirects directly when ?redirect=true)
     */
    async googleLogin(req, res, next) {
        try {
            const redirectTo = req.query.redirectTo;
            const autoRedirect = req.query.redirect === 'true';
            const result = await auth_service_js_1.default.getGoogleOAuthUrl(redirectTo);
            if (autoRedirect) {
                res.redirect(result.url);
                return;
            }
            (0, apiResponse_js_1.sendResponse)({
                res,
                statusCode: 200,
                message: 'Google OAuth URL generated successfully',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/v1/auth/session
     * Exchanges OAuth callback code or verifies tokens & sets Secure HttpOnly Cookies
     */
    async establishSession(req, res, next) {
        try {
            const result = await auth_service_js_1.default.establishSession(req.body);
            setAuthCookies(res, result.session.accessToken, result.session.refreshToken);
            (0, apiResponse_js_1.sendResponse)({
                res,
                statusCode: 200,
                message: 'Authenticated session established successfully',
                data: {
                    user: result.profile,
                    accessToken: result.session.accessToken,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/v1/auth/otp/send
     * Sends Email OTP via Supabase Auth
     */
    async sendOtp(req, res, next) {
        try {
            const { email, fullName } = req.body;
            const result = await auth_service_js_1.default.sendEmailOtp(email, fullName);
            (0, apiResponse_js_1.sendResponse)({
                res,
                statusCode: 200,
                message: result.message,
                data: { email: result.email },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/v1/auth/otp/verify
     * Verifies Email OTP and sets Secure HttpOnly Cookies
     */
    async verifyOtp(req, res, next) {
        try {
            const { email, token } = req.body;
            const result = await auth_service_js_1.default.verifyEmailOtp(email, token);
            setAuthCookies(res, result.session.accessToken, result.session.refreshToken);
            (0, apiResponse_js_1.sendResponse)({
                res,
                statusCode: 200,
                message: 'Email OTP verified successfully',
                data: {
                    user: result.profile,
                    accessToken: result.session.accessToken,
                    refreshToken: result.session.refreshToken,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/v1/auth/register
     */
    async register(req, res, next) {
        try {
            const { email, password, fullName } = req.body;
            const result = await auth_service_js_1.default.registerWithEmail(email, password, fullName);
            (0, apiResponse_js_1.sendResponse)({
                res,
                statusCode: 201,
                message: result.message,
                data: {
                    email: result.email,
                    emailConfirmationRequired: result.emailConfirmationRequired,
                    expiresAt: result.expiresAt,
                    devOtp: result.devOtp,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/v1/auth/login
     */
    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const result = await auth_service_js_1.default.loginWithPassword(email, password);
            setAuthCookies(res, result.session.accessToken, result.session.refreshToken);
            (0, apiResponse_js_1.sendResponse)({
                res,
                statusCode: 200,
                message: 'Login successful',
                data: {
                    user: result.profile,
                    accessToken: result.session.accessToken,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/v1/auth/forgot-password
     */
    async forgotPassword(req, res, next) {
        try {
            const { email } = req.body;
            const result = await auth_service_js_1.default.forgotPassword(email);
            (0, apiResponse_js_1.sendResponse)({
                res,
                statusCode: 200,
                message: result.message,
                data: { email: result.email },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/v1/auth/reset-password
     */
    async resetPassword(req, res, next) {
        try {
            const { email, token, password } = req.body;
            const result = await auth_service_js_1.default.resetPassword(email, token, password);
            (0, apiResponse_js_1.sendResponse)({
                res,
                statusCode: 200,
                message: result.message,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/v1/auth/refresh
     * Refreshes access token using HttpOnly refresh cookie
     */
    async refresh(req, res, next) {
        try {
            const refreshToken = req.cookies?.['sb-refresh-token'] || req.body?.refreshToken;
            if (!refreshToken) {
                throw new apiError_js_1.ApiError(401, 'Refresh token missing. Please log in again.');
            }
            const result = await auth_service_js_1.default.refreshSession(refreshToken);
            setAuthCookies(res, result.session.accessToken, result.session.refreshToken);
            (0, apiResponse_js_1.sendResponse)({
                res,
                statusCode: 200,
                message: 'Session refreshed successfully',
                data: {
                    user: result.profile,
                    accessToken: result.session.accessToken,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/v1/auth/logout
     * Clears HttpOnly session cookies
     */
    async logout(_req, res, next) {
        try {
            clearAuthCookies(res);
            (0, apiResponse_js_1.sendResponse)({
                res,
                statusCode: 200,
                message: 'Logged out successfully',
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getMe(req, res, next) {
        try {
            if (!req.user) {
                throw new apiError_js_1.ApiError(401, 'Unauthorized');
            }
            const profile = await profile_service_js_1.default.getMyProfile(req.user.id, req.user.role);
            (0, apiResponse_js_1.sendResponse)({
                res,
                statusCode: 200,
                message: 'Current profile retrieved successfully',
                data: profile,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async updateMe(req, res, next) {
        try {
            if (!req.user) {
                throw new apiError_js_1.ApiError(401, 'Unauthorized');
            }
            const updated = await profile_service_js_1.default.updateMyProfile(req.user.id, req.user.role, req.body);
            (0, apiResponse_js_1.sendResponse)({
                res,
                statusCode: 200,
                message: 'Profile updated successfully',
                data: updated,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async updateRole(req, res, next) {
        try {
            if (!req.user) {
                throw new apiError_js_1.ApiError(401, 'Unauthorized');
            }
            const userId = req.params.userId;
            const { role } = req.body;
            const updated = await auth_service_js_1.default.updateUserRole(req.user.id, userId, role);
            (0, apiResponse_js_1.sendResponse)({
                res,
                statusCode: 200,
                message: `User role successfully updated to ${role}`,
                data: updated,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async updateStatus(req, res, next) {
        try {
            if (!req.user) {
                throw new apiError_js_1.ApiError(401, 'Unauthorized');
            }
            const userId = req.params.userId;
            const { isBlocked } = req.body;
            const updated = await auth_service_js_1.default.updateUserStatus(req.user.id, userId, isBlocked);
            (0, apiResponse_js_1.sendResponse)({
                res,
                statusCode: 200,
                message: `User status successfully updated (blocked: ${isBlocked})`,
                data: updated,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuthController = AuthController;
exports.authController = new AuthController();
exports.default = exports.authController;
//# sourceMappingURL=auth.controller.js.map