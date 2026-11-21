import { Request, Response, NextFunction } from 'express';
import cacheService from '../services/cache.service.js';
import logger from '../utils/logger.js';

export interface CacheOptions {
  ttlSeconds?: number;
  keyPrefix?: string;
  userSpecific?: boolean;
}

/**
 * Express middleware to automatically cache GET route JSON responses with Upstash Redis
 */
export const cacheResponse = (options: CacheOptions = {}) => {
  const ttl = options.ttlSeconds || 60;
  const prefix = options.keyPrefix || 'dsms:http';
  const isUserSpecific = options.userSpecific ?? true;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Bypass cache if client explicitly asks
    if (
      req.headers['cache-control'] === 'no-cache' ||
      req.query.nocache === 'true' ||
      req.query._nocache
    ) {
      res.setHeader('X-Cache', 'BYPASS');
      return next();
    }

    const userId = (req as any).user?.id || 'public';
    const userPart = isUserSpecific ? `:${userId}` : '';
    const cleanUrl = req.originalUrl || req.url;
    const cacheKey = `${prefix}${userPart}:${cleanUrl}`;

    try {
      const cached = await cacheService.get(cacheKey);
      if (cached !== null && cached !== undefined) {
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-TTL', `${ttl}s`);
        return res.json(cached);
      }
    } catch (err) {
      logger.warn(`Cache middleware get failed for ${cacheKey}:`, err);
    }

    res.setHeader('X-Cache', 'MISS');

    // Intercept res.json to store the response in cache
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      // Only cache successful 200 responses
      if (res.statusCode === 200 && body !== null && body !== undefined) {
        cacheService.set(cacheKey, body, ttl).catch((err) => {
          logger.warn(`Cache middleware write failed for ${cacheKey}:`, err);
        });
      }
      return originalJson(body);
    };

    next();
  };
};
