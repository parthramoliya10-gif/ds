import { Request, Response, NextFunction } from 'express';
import requestService from './request.service.js';
import { sendResponse } from '../../utils/apiResponse.js';
import { ApiError } from '../../utils/apiError.js';
import { Role } from '@prisma/client';

export class RequestController {
  /**
   * POST /api/v1/requests
   * Create new document request with multipart reference files
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Unauthorized');
      }

      const files = req.files as Express.Multer.File[] | undefined;
      const request = await requestService.createRequest(req.user.id, req.body, files);

      sendResponse({
        res,
        statusCode: 201,
        message: 'Document request submitted successfully',
        data: request,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/requests
   * User sees own requests, Admin sees all
   */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Unauthorized');
      }

      const query = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 10,
        status: req.query.status as any,
        search: req.query.search as string | undefined,
      };

      if (req.user.role === Role.ADMIN) {
        const result = await requestService.getAllRequestsForAdmin(query);
        sendResponse({
          res,
          statusCode: 200,
          message: 'Admin requests retrieved successfully',
          data: result,
        });
      } else {
        const result = await requestService.getUserRequests(req.user.id, query);
        sendResponse({
          res,
          statusCode: 200,
          message: 'User requests retrieved successfully',
          data: result,
        });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/requests/:id
   * Get single request details with authorization guard
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Unauthorized');
      }

      const requestId = req.params.id as string;
      const request = await requestService.getRequestById(requestId, req.user);

      sendResponse({
        res,
        statusCode: 200,
        message: 'Request details retrieved successfully',
        data: request,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/requests/:id/status
   * Admin-only: Update request status
   */
  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Unauthorized');
      }

      const requestId = req.params.id as string;
      const { status } = req.body;

      const updated = await requestService.updateStatus(req.user.id, requestId, status);

      sendResponse({
        res,
        statusCode: 200,
        message: `Request status updated to ${status}`,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/requests/:id
   * User can cancel their own PENDING request
   */
  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Unauthorized');
      }

      const requestId = req.params.id as string;
      const cancelled = await requestService.cancelRequest(req.user.id, requestId);

      sendResponse({
        res,
        statusCode: 200,
        message: 'Request cancelled successfully',
        data: cancelled,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const requestController = new RequestController();
export default requestController;
