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
import adminRoutes from './modules/admin/admin.routes.js';
import profileRoutes from './modules/profile/profile.routes.js';

export interface CreateAppOptions {
  /**
   * When true, runs in unified single-domain mode (Express API + Socket.IO + Next.js on ONE port).
   * Scopes rate limiting, body parsers, and 404 JSON fallback to API routes so Next.js handles UI pages.
   */
  unifiedFrontend?: boolean;
}

export const createApp = (options: CreateAppOptions = {}): Application => {
  const { unifiedFrontend = false } = options;
  const app = express();

  // Trust reverse proxy headers (Hostinger / LiteSpeed / Nginx) for accurate client IP & HTTPS detection
  app.set('trust proxy', 1);

  // 1. Security HTTP Headers
  app.use(
    helmet({
      // Disable Helmet default CSP in unified mode so Next.js scripts, Razorpay & Cloudinary load cleanly
      contentSecurityPolicy: unifiedFrontend ? false : undefined,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginEmbedderPolicy: false,
    })
  );

  // 2. CORS configuration (also allows www.<domain> automatically when CLIENT_URL is set)
  const allowedOrigins = new Set<string>([
    env.CLIENT_URL,
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
  ]);

  if (env.CLIENT_URL.startsWith('https://') && !env.CLIENT_URL.startsWith('https://www.')) {
    allowedOrigins.add(env.CLIENT_URL.replace('https://', 'https://www.'));
  }

  const corsMiddleware = cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (same-origin server requests, mobile apps, curl, webhooks)
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      return callback(new ApiError(403, `CORS blocked: Origin ${origin} is not allowed.`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  });

  if (unifiedFrontend) {
    app.use(env.API_PREFIX, corsMiddleware);
  } else {
    app.use(corsMiddleware);
  }

  // 3. Request Logging
  if (env.NODE_ENV !== 'test') {
    app.use(
      unifiedFrontend ? env.API_PREFIX : '/',
      morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev')
    );
  }

  // 4. Rate Limiting (scoped to API routes in unified mode so Next.js static assets aren't throttled)
  if (unifiedFrontend) {
    app.use(env.API_PREFIX, rateLimiter);
  } else {
    app.use(rateLimiter);
  }

  // 5. Body Parsers & Cookie Parser (with rawBody capture for Webhook HMAC verification)
  const jsonParser = express.json({
    limit: '10mb',
    verify: (req: Request, _res: Response, buf: Buffer) => {
      (req as any).rawBody = buf;
    },
  });
  const urlencodedParser = express.urlencoded({ extended: true, limit: '10mb' });
  const cookies = cookieParser();

  if (unifiedFrontend) {
    app.use(env.API_PREFIX, jsonParser, urlencodedParser, cookies);
  } else {
    app.use(jsonParser);
    app.use(urlencodedParser);
    app.use(cookies);
  }

  // 6. Health Check Endpoints
  app.get(['/health', `${env.API_PREFIX}/health`], (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'healthy',
      mode: unifiedFrontend ? 'unified-single-domain' : 'standalone-api',
      timestamp: new Date().toISOString(),
      service: 'Document Service Backend API',
      version: '1.0.0',
    });
  });

  // 7. Mount Module Routes
  app.use(`${env.API_PREFIX}/auth`, authRoutes);
  app.use(`${env.API_PREFIX}/profile`, profileRoutes);
  app.use(`${env.API_PREFIX}/requests`, requestRoutes);
  app.use(`${env.API_PREFIX}/quotations`, quotationRoutes);
  app.use(`${env.API_PREFIX}/payments`, paymentRoutes);
  app.use(`${env.API_PREFIX}/chat`, chatRoutes);
  app.use(`${env.API_PREFIX}/documents`, documentRoutes);
  app.use(`${env.API_PREFIX}/admin`, adminRoutes);

  // 8. 404 Fallback & Centralized Error Handler
  if (unifiedFrontend) {
    app.use(env.API_PREFIX, (req: Request, _res: Response, next: NextFunction) => {
      next(new ApiError(404, `API route ${req.method} ${req.originalUrl} not found.`));
    });
    app.use(env.API_PREFIX, errorHandler);
  } else {
    app.use((req: Request, _res: Response, next: NextFunction) => {
      next(new ApiError(404, `Route ${req.method} ${req.originalUrl} not found.`));
    });
    app.use(errorHandler);
  }

  return app;
};

export default createApp;
