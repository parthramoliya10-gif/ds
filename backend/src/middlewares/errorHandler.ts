import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError.js';
import logger from '../utils/logger.js';
import env from '../config/env.js';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || [];

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token signature.';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token expired. Please refresh session.';
  } else if (err.code === 'P2002') {
    statusCode = 409;
    message = 'A duplicate record already exists.';
  }

  // Log only unexpected 500 server errors
  if (statusCode >= 500) {
    logger.error(`[Server Error] ${err.message}`, { stack: err.stack });
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors: errors.length > 0 ? errors : undefined,
    stack: env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};
