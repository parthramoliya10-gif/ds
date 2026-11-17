import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { ApiError } from '../utils/apiError.js';

export const requireRole = (...allowedRoles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new ApiError(401, 'Unauthorized: Please log in.'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          `Forbidden: Access denied. Required role: [${allowedRoles.join(', ')}], your role: [${req.user.role}]`
        )
      );
    }

    next();
  };
};

export const requireAdmin = requireRole(Role.ADMIN);
export const requireUser = requireRole(Role.USER);
