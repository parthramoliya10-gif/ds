import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
export declare const requireRole: (...allowedRoles: Role[]) => (req: Request, _res: Response, next: NextFunction) => void;
export declare const requireAdmin: (req: Request, _res: Response, next: NextFunction) => void;
export declare const requireUser: (req: Request, _res: Response, next: NextFunction) => void;
