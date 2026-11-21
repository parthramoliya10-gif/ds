import { Request, Response, NextFunction } from 'express';
import paymentService from './payment.service.js';
import { sendResponse } from '../../utils/apiResponse.js';
import { ApiError } from '../../utils/apiError.js';

export class PaymentController {
  /**
   * POST /api/v1/payments/create-order
   * Create Razorpay order for ADVANCE_50 or FINAL_50
   */
  async createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Unauthorized');
      }

      const { requestId, milestone } = req.body;
      const order = await paymentService.createPaymentOrder(req.user.id, requestId, milestone);

      sendResponse({
        res,
        statusCode: 201,
        message: 'Razorpay order created successfully',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/payments/verify
   * Client-side checkout callback verification
   */
  async verify(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Unauthorized');
      }

      const result = await paymentService.verifyPayment(req.user.id, req.body);
      sendResponse({
        res,
        statusCode: 200,
        message: 'Payment verified successfully! Milestone updated.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/payments/complete
   * Record or finalize milestone payment (for verified checkout & sandbox simulation)
   */
  async completePayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Unauthorized');
      }

      const { requestId, milestone, transactionId } = req.body;
      const result = await paymentService.completeMilestonePayment(
        req.user.id,
        requestId,
        milestone,
        transactionId
      );

      sendResponse({
        res,
        statusCode: 200,
        message: 'Payment recorded successfully! Download unlocked.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/payments/webhook
   * Server-to-Server Razorpay Webhook receiver
   */
  async webhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const signature = req.headers['x-razorpay-signature'] as string;
      const rawBody = (req as any).rawBody || JSON.stringify(req.body);

      const result = await paymentService.processWebhook(rawBody, signature);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/payments/my-history
   * Get logged-in user's payment records
   */
  async myHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Unauthorized');
      }

      const history = await paymentService.getUserPayments(req.user.id);
      sendResponse({
        res,
        statusCode: 200,
        message: 'Payment history retrieved successfully',
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/payments/admin/all
   * Admin-only: View all payments and revenue
   */
  async adminList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Unauthorized');
      }

      const payments = await paymentService.getAllPaymentsForAdmin();
      sendResponse({
        res,
        statusCode: 200,
        message: 'All payments retrieved successfully',
        data: payments,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const paymentController = new PaymentController();
export default paymentController;
