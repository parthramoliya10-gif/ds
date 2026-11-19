import { Request, Response, NextFunction } from 'express';
export declare class RequestController {
    /**
     * POST /api/v1/requests
     * Create new document request with multipart reference files
     */
    create(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/requests
     * User sees own requests, Admin sees all
     */
    list(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/requests/:id
     * Get single request details with authorization guard
     */
    getById(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * PATCH /api/v1/requests/:id/status
     * Admin-only: Update request status
     */
    updateStatus(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * DELETE /api/v1/requests/:id
     * User can cancel their own PENDING request
     */
    cancel(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const requestController: RequestController;
export default requestController;
