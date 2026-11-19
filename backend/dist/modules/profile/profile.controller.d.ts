import { Request, Response, NextFunction } from 'express';
export declare class ProfileController {
    /**
     * GET /api/v1/profile
     * Fetch full profile for logged-in User or Admin
     */
    getMyProfile(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * PATCH /api/v1/profile
     * Update profile fields for logged-in User or Admin
     */
    updateMyProfile(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/v1/profile/avatar
     * Upload / replace profile avatar photo
     */
    uploadAvatar(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * DELETE /api/v1/profile/avatar
     * Remove profile avatar
     */
    removeAvatar(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * PATCH /api/v1/profile/password
     * Change account password
     */
    changePassword(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const profileController: ProfileController;
export default profileController;
