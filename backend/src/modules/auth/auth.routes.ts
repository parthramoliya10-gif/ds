import { Router } from 'express';
import authController from './auth.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireAdmin } from '../../middlewares/rbac.middleware.js';
import { validateRequest } from '../../middlewares/validate.middleware.js';
import {
  updateProfileSchema,
  updateRoleSchema,
  updateStatusSchema,
} from './auth.validation.js';

const router = Router();

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
