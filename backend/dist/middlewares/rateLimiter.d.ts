import { Request, Response, NextFunction } from 'express';
export declare const rateLimiter: (req: Request, _res: Response, next: NextFunction) => Promise<void>;
/**
 * Strict authentication rate limiter: 15 requests per minute per IP
 * Specifically protects login, password reset, and OTP generation from brute-force/credential stuffing
 */
export declare const authRateLimiter: (req: Request, _res: Response, next: NextFunction) => Promise<void>;
