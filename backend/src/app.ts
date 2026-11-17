import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import env from './config/env.js';
import { rateLimiter } from './middlewares/rateLimiter.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { ApiError } from './utils/apiError.js';
import authRoutes from './modules/auth/auth.routes.js';
import requestRoutes from './modules/requests/request.routes.js';
import quotationRoutes from './modules/quotations/quotation.routes.js';
import paymentRoutes from './modules/payments/payment.routes.js';
import chatRoutes from './modules/chat/chat.routes.js';
import documentRoutes from './modules/documents/document.routes.js';

export const createApp = (): Application => {
  const app = express();

  // 1. Security HTTP Headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginEmbedderPolicy: false,
    })
  );

  // 2. CORS configuration
  const allowedOrigins = [
    env.CLIENT_URL,
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new ApiError(403, `CORS blocked: Origin ${origin} is not allowed.`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    })
  );

  // 3. Request Logging
  if (env.NODE_ENV !== 'test') {
    app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  }

  // 4. Rate Limiting
  app.use(rateLimiter);

  // 5. Body Parsers & Cookie Parser (with rawBody capture for Webhook HMAC verification)
  app.use(
    express.json({
      limit: '10mb',
      verify: (req: Request, _res: Response, buf: Buffer) => {
        (req as any).rawBody = buf;
      },
    })
  );
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // 6. Health Check Endpoints
  app.get(['/health', `${env.API_PREFIX}/health`], (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'Document Service Backend API',
      version: '1.0.0',
    });
  });

  // 7. Mount Module Routes
  app.use(`${env.API_PREFIX}/auth`, authRoutes);
  app.use(`${env.API_PREFIX}/requests`, requestRoutes);
  app.use(`${env.API_PREFIX}/quotations`, quotationRoutes);
  app.use(`${env.API_PREFIX}/payments`, paymentRoutes);
  app.use(`${env.API_PREFIX}/chat`, chatRoutes);
  app.use(`${env.API_PREFIX}/documents`, documentRoutes);

  // 8. 404 Fallback Handler
  app.use((req: Request, _res: Response, next: NextFunction) => {
    next(new ApiError(404, `Route ${req.method} ${req.originalUrl} not found.`));
  });

  // 9. Centralized Error Handler
  app.use(errorHandler);

  return app;
};

export default createApp;
