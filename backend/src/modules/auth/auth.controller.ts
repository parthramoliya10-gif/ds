import { Request, Response, NextFunction } from 'express';
import authService from './auth.service.js';
import env from '../../config/env.js';
import { sendResponse } from '../../utils/apiResponse.js';
import { ApiError } from '../../utils/apiError.js';

const isProd = env.NODE_ENV === 'production';

const setAuthCookies = (res: Response, accessToken: string, refreshToken?: string) => {
  res.cookie('sb-access-token', accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    maxAge: 60 * 60 * 1000, // 1 hour
    path: '/',
  });

  if (refreshToken) {
    res.cookie('sb-refresh-token', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });
  }
};

const clearAuthCookies = (res: Response) => {
  const cookieOpts = {
    httpOnly: true,
    secure: isProd,
    sameSite: (isProd ? 'strict' : 'lax') as 'strict' | 'lax',
    path: '/',
  };
  res.clearCookie('sb-access-token', cookieOpts);
  res.clearCookie('sb-refresh-token', cookieOpts);
  res.clearCookie('access_token', cookieOpts);
};

export class AuthController {
  /**
   * GET /api/v1/auth/google
   * Returns Google OAuth URL (or redirects directly when ?redirect=true)
   */
  async googleLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const redirectTo = req.query.redirectTo as string | undefined;
      const autoRedirect = req.query.redirect === 'true';

      const result = await authService.getGoogleOAuthUrl(redirectTo);

      if (autoRedirect) {
        res.redirect(result.url);
        return;
      }

      sendResponse({
        res,
        statusCode: 200,
        message: 'Google OAuth URL generated successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/session
   * Exchanges OAuth callback code or verifies tokens & sets Secure HttpOnly Cookies
   */
  async establishSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.establishSession(req.body);
      setAuthCookies(res, result.session.accessToken, result.session.refreshToken);

      sendResponse({
        res,
        statusCode: 200,
        message: 'Authenticated session established successfully',
        data: {
          user: result.profile,
          accessToken: result.session.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/otp/send
   * Sends Email OTP via Supabase Auth
   */
  async sendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, fullName } = req.body;
      const result = await authService.sendEmailOtp(email, fullName);

      sendResponse({
        res,
        statusCode: 200,
        message: result.message,
        data: { email: result.email },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/otp/verify
   * Verifies Email OTP and sets Secure HttpOnly Cookies
   */
  async verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, token } = req.body;
      const result = await authService.verifyEmailOtp(email, token);
      setAuthCookies(res, result.session.accessToken, result.session.refreshToken);

      sendResponse({
        res,
        statusCode: 200,
        message: 'Email OTP verified successfully',
        data: {
          user: result.profile,
          accessToken: result.session.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/register
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, fullName } = req.body;
      const result = await authService.registerWithEmail(email, password, fullName);

      if (result.session) {
        setAuthCookies(res, result.session.accessToken, result.session.refreshToken);
      }

      sendResponse({
        res,
        statusCode: 201,
        message: result.emailConfirmationRequired
          ? 'Registration successful. Please verify your email with the OTP/link sent.'
          : 'Registration successful.',
        data: {
          user: result.profile,
          emailConfirmationRequired: result.emailConfirmationRequired,
          accessToken: result.session?.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/login
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await authService.loginWithPassword(email, password);
      setAuthCookies(res, result.session.accessToken, result.session.refreshToken);

      sendResponse({
        res,
        statusCode: 200,
        message: 'Login successful',
        data: {
          user: result.profile,
          accessToken: result.session.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/forgot-password
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, redirectTo } = req.body;
      const result = await authService.forgotPassword(email, redirectTo);

      sendResponse({
        res,
        statusCode: 200,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/refresh
   * Refreshes access token using HttpOnly refresh cookie
   */
  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies?.['sb-refresh-token'] || req.body?.refreshToken;
      if (!refreshToken) {
        throw new ApiError(401, 'Refresh token missing. Please log in again.');
      }

      const result = await authService.refreshSession(refreshToken);
      setAuthCookies(res, result.session.accessToken, result.session.refreshToken);

      sendResponse({
        res,
        statusCode: 200,
        message: 'Session refreshed successfully',
        data: {
          user: result.profile,
          accessToken: result.session.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/logout
   * Clears HttpOnly session cookies
   */
  async logout(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      clearAuthCookies(res);
      sendResponse({
        res,
        statusCode: 200,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Unauthorized');
      }
      const profile = await authService.getProfile(req.user.id, req.user.role);
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
      const updated = await authService.updateProfile(req.user.id, req.user.role, req.body);
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
