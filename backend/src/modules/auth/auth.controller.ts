import { Request, Response, NextFunction } from 'express';
import authService from './auth.service.js';
import { sendResponse } from '../../utils/apiResponse.js';
import { ApiError } from '../../utils/apiError.js';

export class AuthController {
  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Unauthorized');
      }
      const profile = await authService.getProfile(req.user.id);
      sendResponse({
        res,
        statusCode: 200,
        message: 'Current profile retrieved successfully',
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Unauthorized');
      }
      const updated = await authService.updateProfile(req.user.id, req.body);
      sendResponse({
        res,
        statusCode: 200,
        message: 'Profile updated successfully',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Unauthorized');
      }
      const userId = req.params.userId as string;
      const { role } = req.body;

      const updated = await authService.updateUserRole(req.user.id, userId, role);
      sendResponse({
        res,
        statusCode: 200,
        message: `User role successfully updated to ${role}`,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Unauthorized');
      }
      const userId = req.params.userId as string;
      const { isBlocked } = req.body;

      const updated = await authService.updateUserStatus(req.user.id, userId, isBlocked);
      sendResponse({
        res,
        statusCode: 200,
        message: `User status successfully updated (blocked: ${isBlocked})`,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
export default authController;
