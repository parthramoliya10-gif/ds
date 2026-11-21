import { Request, Response, NextFunction } from 'express';
import adminService from './admin.service.js';
import { sendResponse } from '../../utils/apiResponse.js';
import { ApiError } from '../../utils/apiError.js';

export class AdminController {
  /**
   * GET /api/v1/admin/dashboard/stats
   * Global analytics for Admin dashboard
   */
  async getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Unauthorized');
      }

      const stats = await adminService.getDashboardStats();
      sendResponse({
        res,
        statusCode: 200,
        message: 'Admin dashboard statistics retrieved successfully',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/audit-logs
   * View security audit trail
   */
  async getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Unauthorized');
      }

      const query = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
        action: req.query.action as string | undefined,
        actorId: req.query.actorId as string | undefined,
      };

      const result = await adminService.getAuditLogs(query);
      sendResponse({
        res,
        statusCode: 200,
        message: 'Audit logs retrieved successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/cache/flush
   * Flush all Redis cache
   */
  async flushCache(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Unauthorized');
      }
      const { cacheService } = await import('../../services/cache.service.js');
      await cacheService.delPattern('dsms:*');
      sendResponse({
        res,
        statusCode: 200,
        message: 'All application caches flushed successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
export default adminController;
