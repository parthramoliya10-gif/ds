import { Request, Response, NextFunction } from 'express';
export declare class QuotationController {
    /**
     * POST /api/v1/quotations
     * Admin-only: Create and send quotation
     */
    create(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/quotations/request/:requestId
     * Get all quotation versions for request
     */
    getByRequest(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/v1/quotations/:id/accept
     * User accepts quotation & generates 50% advance Razorpay order
     */
    accept(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/v1/quotations/:id/reject
     * User rejects quotation
     */
    reject(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const quotationController: QuotationController;
export default quotationController;
