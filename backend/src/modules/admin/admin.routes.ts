import { Router } from 'express';
import adminController from './admin.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireAdmin } from '../../middlewares/rbac.middleware.js';
import { cacheResponse } from '../../middlewares/cache.middleware.js';
import { CACHE_TTL } from '../../services/cache.service.js';

const router = Router();

// Strict security: All admin routes require authentication AND Admin role
router.use(authenticate);
router.use(requireAdmin);

// 1. Dashboard metrics & financial overview (Cached with Upstash Redis)
router.get(
  '/dashboard/stats',
  cacheResponse({ ttlSeconds: CACHE_TTL.ADMIN_STATS, keyPrefix: 'admin:stats', userSpecific: false }),
  adminController.getDashboardStats
);

// 2. Security & activity audit logs
router.get('/audit-logs', adminController.getAuditLogs);

// 3. Cache management (Admin flush)
router.post('/cache/flush', adminController.flushCache);

export default router;
