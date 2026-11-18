import { Request, Response, NextFunction } from 'express';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import env from '../config/env.js';
import { ApiError } from '../utils/apiError.js';
import logger from '../utils/logger.js';

let redisClient: Redis | null = null;
let upstashRatelimit: Ratelimit | null = null;

if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    redisClient = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });

    upstashRatelimit = new Ratelimit({
      redis: redisClient,
      limiter: Ratelimit.slidingWindow(60, '1 m'), // 60 requests per minute per IP
      analytics: true,
      prefix: 'ratelimit',
    });
    logger.info('✅ Upstash Redis Rate Limiter initialized');
  } catch (error) {
    logger.warn('⚠️ Failed to initialize Upstash Redis. Falling back to local memory limiter.');
  }
}

// In-memory fallback tracking map
const memoryLimitMap = new Map<string, { count: number; expiresAt: number }>();

export const rateLimiter = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  // Exclude healthcheck from rate limit
  if (req.path === '/health' || req.path === '/api/v1/health') {
    return next();
  }

  const clientIp =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
    req.socket.remoteAddress ||
    '127.0.0.1';

  if (upstashRatelimit) {
    try {
      const { success, limit, remaining, reset } = await upstashRatelimit.limit(clientIp);
      if (!success) {
        return next(
          new ApiError(429, `Too many requests. Limit: ${limit}. Try again in a minute.`)
        );
      }
      return next();
    } catch (err) {
      logger.error('Upstash rate limit evaluation failed, continuing with request', err);
      return next();
    }
  }

  // In-memory rate limiting fallback (100 req per min)
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 100;

  // Prevent memory leak by pruning expired entries periodically
  if (memoryLimitMap.size > 500) {
    for (const [key, entry] of memoryLimitMap.entries()) {
      if (now > entry.expiresAt) {
        memoryLimitMap.delete(key);
      }
    }
  }

  const current = memoryLimitMap.get(clientIp);
  if (!current || now > current.expiresAt) {
    memoryLimitMap.set(clientIp, { count: 1, expiresAt: now + windowMs });
    return next();
  }

  if (current.count >= maxRequests) {
    return next(new ApiError(429, 'Too many requests. Please slow down and try again later.'));
  }

  current.count += 1;
  next();
};
