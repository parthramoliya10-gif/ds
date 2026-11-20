import { Request, Response, NextFunction } from 'express';
export declare class AuthController {
    /**
     * GET /api/v1/auth/google
     * Returns Google OAuth URL (or redirects directly when ?redirect=true)
     */
    googleLogin(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/v1/auth/session
     * Exchanges OAuth callback code or verifies tokens & sets Secure HttpOnly Cookies
     */
    establishSession(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/v1/auth/otp/send
     * Sends Email OTP via Supabase Auth
     */
    sendOtp(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/v1/auth/otp/verify
     * Verifies Email OTP and sets Secure HttpOnly Cookies
     */
    verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/v1/auth/register
     */
    register(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/v1/auth/login
     */
    login(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/v1/auth/forgot-password
     */
    forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/v1/auth/reset-password
     */
    resetPassword(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/v1/auth/refresh
     * Refreshes access token using HttpOnly refresh cookie
     */
    refresh(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/v1/auth/logout
     * Clears HttpOnly session cookies
     */
    logout(_req: Request, res: Response, next: NextFunction): Promise<void>;
    getMe(req: Request, res: Response, next: NextFunction): Promise<void>;
    updateMe(req: Request, res: Response, next: NextFunction): Promise<void>;
    updateRole(req: Request, res: Response, next: NextFunction): Promise<void>;
    updateStatus(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const authController: AuthController;
export default authController;
