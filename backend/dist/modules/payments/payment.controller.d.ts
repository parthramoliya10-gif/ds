import { Request, Response, NextFunction } from 'express';
export declare class PaymentController {
    /**
     * POST /api/v1/payments/create-order
     * Create Razorpay order for ADVANCE_50 or FINAL_50
     */
    createOrder(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/v1/payments/verify
     * Client-side checkout callback verification
     */
    verify(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/v1/payments/complete
     * Record or finalize milestone payment (for verified checkout & sandbox simulation)
     */
    completePayment(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/v1/payments/webhook
     * Server-to-Server Razorpay Webhook receiver
     */
    webhook(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/payments/my-history
     * Get logged-in user's payment records
     */
    myHistory(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/payments/admin/all
     * Admin-only: View all payments and revenue
     */
    adminList(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const paymentController: PaymentController;
export default paymentController;
