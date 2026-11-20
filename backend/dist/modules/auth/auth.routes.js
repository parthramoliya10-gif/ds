"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_js_1 = __importDefault(require("./auth.controller.js"));
const auth_middleware_js_1 = require("../../middlewares/auth.middleware.js");
const rbac_middleware_js_1 = require("../../middlewares/rbac.middleware.js");
const validate_middleware_js_1 = require("../../middlewares/validate.middleware.js");
const auth_validation_js_1 = require("./auth.validation.js");
const profile_validation_js_1 = require("../profile/profile.validation.js");
const router = (0, express_1.Router)();
// ==========================================
// Public Authentication Routes (Supabase Auth)
// ==========================================
// Google OAuth URL / Redirect
router.get('/google', auth_controller_js_1.default.googleLogin);
// Establish HttpOnly Cookie Session (after OAuth callback)
router.post('/session', (0, validate_middleware_js_1.validateRequest)({ body: auth_validation_js_1.establishSessionSchema }), auth_controller_js_1.default.establishSession);
// Email OTP Login / Registration
router.post('/otp/send', (0, validate_middleware_js_1.validateRequest)({ body: auth_validation_js_1.sendOtpSchema }), auth_controller_js_1.default.sendOtp);
router.post('/otp/verify', (0, validate_middleware_js_1.validateRequest)({ body: auth_validation_js_1.verifyOtpSchema }), auth_controller_js_1.default.verifyOtp);
// Email & Password Registration / Login
router.post('/register', (0, validate_middleware_js_1.validateRequest)({ body: auth_validation_js_1.registerSchema }), auth_controller_js_1.default.register);
router.post('/login', (0, validate_middleware_js_1.validateRequest)({ body: auth_validation_js_1.loginSchema }), auth_controller_js_1.default.login);
// Forgot & Reset Password (6-Digit OTP Verified)
router.post('/forgot-password', (0, validate_middleware_js_1.validateRequest)({ body: auth_validation_js_1.forgotPasswordSchema }), auth_controller_js_1.default.forgotPassword);
router.post('/reset-password', (0, validate_middleware_js_1.validateRequest)({ body: auth_validation_js_1.resetPasswordSchema }), auth_controller_js_1.default.resetPassword);
// Refresh Session & Logout
router.post('/refresh', auth_controller_js_1.default.refresh);
router.post('/logout', auth_controller_js_1.default.logout);
// ==========================================
// User Profile Routes (Authenticated)
// ==========================================
router.get('/me', auth_middleware_js_1.authenticate, auth_controller_js_1.default.getMe);
router.patch('/me', auth_middleware_js_1.authenticate, (0, validate_middleware_js_1.validateRequest)({ body: profile_validation_js_1.updateProfileSchema }), auth_controller_js_1.default.updateMe);
// ==========================================
// Admin Security & Access Routes (Admin only)
// ==========================================
router.patch('/admin/users/:userId/role', auth_middleware_js_1.authenticate, rbac_middleware_js_1.requireAdmin, (0, validate_middleware_js_1.validateRequest)({ body: auth_validation_js_1.updateRoleSchema }), auth_controller_js_1.default.updateRole);
router.patch('/admin/users/:userId/status', auth_middleware_js_1.authenticate, rbac_middleware_js_1.requireAdmin, (0, validate_middleware_js_1.validateRequest)({ body: auth_validation_js_1.updateStatusSchema }), auth_controller_js_1.default.updateStatus);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map