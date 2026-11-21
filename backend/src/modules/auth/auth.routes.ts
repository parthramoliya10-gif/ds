import { Router } from 'express';
import authController from './auth.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireAdmin } from '../../middlewares/rbac.middleware.js';
import { validateRequest } from '../../middlewares/validate.middleware.js';
import { authRateLimiter } from '../../middlewares/rateLimiter.js';
import {
  sendOtpSchema,
  verifyOtpSchema,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  establishSessionSchema,
  updateRoleSchema,
  updateStatusSchema,
} from './auth.validation.js';
import { updateProfileSchema } from '../profile/profile.validation.js';

const router = Router();

// ==========================================
// Public Authentication Routes (Supabase Auth)
// ==========================================

// Google OAuth URL / Redirect
router.get('/google', authController.googleLogin);

// Establish HttpOnly Cookie Session (after OAuth callback)
router.post(
  '/session',
  validateRequest({ body: establishSessionSchema }),
  authController.establishSession
);

// Email OTP Login / Registration
router.post(
  '/otp/send',
  authRateLimiter,
  validateRequest({ body: sendOtpSchema }),
  authController.sendOtp
);
router.post(
  '/otp/verify',
  authRateLimiter,
  validateRequest({ body: verifyOtpSchema }),
  authController.verifyOtp
);

// Email & Password Registration / Login
router.post(
  '/register',
  authRateLimiter,
  validateRequest({ body: registerSchema }),
  authController.register
);
router.post(
  '/login',
  authRateLimiter,
  validateRequest({ body: loginSchema }),
  authController.login
);

// Forgot & Reset Password (6-Digit OTP Verified)
router.post(
  '/forgot-password',
  authRateLimiter,
  validateRequest({ body: forgotPasswordSchema }),
  authController.forgotPassword
);
router.post(
  '/reset-password',
  authRateLimiter,
  validateRequest({ body: resetPasswordSchema }),
  authController.resetPassword
);

// Refresh Session & Logout
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

// ==========================================
// User Profile Routes (Authenticated)
// ==========================================
router.get('/me', authenticate, authController.getMe);
router.patch(
  '/me',
  authenticate,
  validateRequest({ body: updateProfileSchema }),
  authController.updateMe
);

// ==========================================
// Admin Security & Access Routes (Admin only)
// ==========================================
router.patch(
  '/admin/users/:userId/role',
  authenticate,
  requireAdmin,
  validateRequest({ body: updateRoleSchema }),
  authController.updateRole
);

router.patch(
  '/admin/users/:userId/status',
  authenticate,
  requireAdmin,
  validateRequest({ body: updateStatusSchema }),
  authController.updateStatus
);

export default router;
