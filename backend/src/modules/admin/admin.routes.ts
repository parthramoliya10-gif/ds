import { Router } from 'express';
import adminController from './admin.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireAdmin } from '../../middlewares/rbac.middleware.js';

const router = Router();

// Strict security: All admin routes require authentication AND Admin role
router.use(authenticate);
router.use(requireAdmin);

// 1. Dashboard metrics & financial overview
router.get('/dashboard/stats', adminController.getDashboardStats);

// 2. Security & activity audit logs
router.get('/audit-logs', adminController.getAuditLogs);

export default router;
