import { Request, Response, NextFunction } from 'express';
export declare class AdminController {
    /**
     * GET /api/v1/admin/dashboard/stats
     * Global analytics for Admin dashboard
     */
    getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/admin/audit-logs
     * View security audit trail
     */
    getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const adminController: AdminController;
export default adminController;
