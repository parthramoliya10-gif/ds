import { Request, Response, NextFunction } from 'express';
import quotationService from './quotation.service.js';
import { sendResponse } from '../../utils/apiResponse.js';
import { ApiError } from '../../utils/apiError.js';

export class QuotationController {
  /**
   * POST /api/v1/quotations
   * Admin-only: Create and send quotation
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Unauthorized');
      }

      const quotation = await quotationService.createQuotation(req.user.id, req.body);
      sendResponse({
        res,
        statusCode: 201,
        message: 'Quotation created and posted to chat successfully',
        data: quotation,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/quotations/request/:requestId
   * Get all quotation versions for request
   */
  async getByRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Unauthorized');
      }

      const requestId = req.params.requestId as string;
      const quotations = await quotationService.getQuotationsForRequest(requestId, req.user);

      sendResponse({
        res,
        statusCode: 200,
        message: 'Quotations retrieved successfully',
        data: quotations,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/quotations/:id/accept
   * User accepts quotation & generates 50% advance Razorpay order
   */
  async accept(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Unauthorized');
      }

      const quotationId = req.params.id as string;
      const result = await quotationService.acceptQuotation(req.user.id, quotationId);

      sendResponse({
        res,
        statusCode: 200,
        message: 'Quotation accepted! Advance 50% payment order created.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/quotations/:id/reject
   * User rejects quotation
   */
  async reject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Unauthorized');
      }

      const quotationId = req.params.id as string;
      const { reason } = req.body;
      const result = await quotationService.rejectQuotation(req.user.id, quotationId, reason);

      sendResponse({
        res,
        statusCode: 200,
        message: 'Quotation rejected.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const quotationController = new QuotationController();
export default quotationController;
