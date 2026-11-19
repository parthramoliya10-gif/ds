import { Request, Response, NextFunction } from 'express';
export declare const rateLimiter: (req: Request, _res: Response, next: NextFunction) => Promise<void>;
