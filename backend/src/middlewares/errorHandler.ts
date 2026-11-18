import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
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
  const errors = err.errors || [];

  // Multer upload validation errors
  if (err instanceof multer.MulterError) {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'Uploaded file exceeds the maximum allowed size limit.';
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      message = 'Too many files uploaded in a single request.';
    } else {
      message = `File upload error: ${err.message}`;
    }
  }
  // Malformed JSON request payload
  else if (err instanceof SyntaxError && 'body' in err) {
    statusCode = 400;
    message = 'Invalid JSON payload in request body.';
  }
  // JWT errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token signature.';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token expired. Please refresh session.';
  }
  // Prisma database errors
  else if (err.code === 'P2002') {
    statusCode = 409;
    message = 'A duplicate record already exists.';
  } else if (err.code === 'P2025') {
    statusCode = 404;
    message = 'Requested record not found.';
  } else if (err.code === 'P2003') {
    statusCode = 400;
    message = 'Invalid reference ID provided (foreign key constraint failed).';
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
