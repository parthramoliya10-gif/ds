import { Request, Response, NextFunction } from 'express';
import profileService from './profile.service.js';
import { sendResponse } from '../../utils/apiResponse.js';
import { ApiError } from '../../utils/apiError.js';

export class ProfileController {
  /**
   * GET /api/v1/profile
   * Fetch full profile for logged-in User or Admin
   */
  async getMyProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Unauthorized');
      }
      const profile = await profileService.getMyProfile(req.user.id, req.user.role);
      sendResponse({
        res,
        statusCode: 200,
        message: 'Profile retrieved successfully',
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/profile
   * Update profile fields for logged-in User or Admin
   */
  async updateMyProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Unauthorized');
      }
      const updated = await profileService.updateMyProfile(
        req.user.id,
        req.user.role,
        req.body
      );
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

  /**
   * POST /api/v1/profile/avatar
   * Upload / replace profile avatar photo
   */
  async uploadAvatar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Unauthorized');
      }
      if (!req.file) {
        throw new ApiError(400, 'Please select an avatar image (JPEG, PNG, or WEBP).');
      }

      const result = await profileService.uploadAvatar(
        req.user.id,
        req.user.role,
        req.file
      );
      sendResponse({
        res,
        statusCode: 200,
        message: 'Profile avatar uploaded successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/profile/avatar
   * Remove profile avatar
   */
  async removeAvatar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Unauthorized');
      }
      const result = await profileService.removeAvatar(req.user.id, req.user.role);
      sendResponse({
        res,
        statusCode: 200,
        message: 'Profile avatar removed successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/profile/password
   * Change account password
   */
  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Unauthorized');
      }
      const result = await profileService.changePassword(
        req.user.id,
        req.user.email,
        req.user.role,
        req.body
      );
      sendResponse({
        res,
        statusCode: 200,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const profileController = new ProfileController();
export default profileController;
