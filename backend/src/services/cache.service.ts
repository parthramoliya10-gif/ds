import { Redis } from '@upstash/redis';
import env from '../config/env.js';
import logger from '../utils/logger.js';

export const CACHE_TTL = {
  ADMIN_STATS: 60, // 1 minute
  USER_REQUESTS: 60, // 1 minute
  REQUEST_DETAIL: 120, // 2 minutes
  USER_PROFILE: 300, // 5 minutes
  AUDIT_LOGS: 30, // 30 seconds
};

export const CACHE_KEYS = {
  ADMIN_STATS: 'dsms:admin:stats',
  ADMIN_AUDIT_LOGS: (page: number, limit: number, action?: string) =>
    `dsms:admin:audit:${page}:${limit}:${action || 'all'}`,
  USER_REQUESTS: (userId: string, queryStr = 'default') =>
    `dsms:requests:user:${userId}:${queryStr}`,
  REQUEST_DETAIL: (requestId: string) => `dsms:request:${requestId}`,
  USER_PROFILE: (userId: string) => `dsms:profile:${userId}`,
};

class CacheService {
  private client: Redis | null = null;
  private isConnected = false;
  private localMemoryFallback = new Map<string, { value: any; expiresAt: number }>();

  constructor() {
    this.init();
  }

  private init() {
    try {
      const url = env.UPSTASH_REDIS_REST_URL;
      const token = env.UPSTASH_REDIS_REST_TOKEN;

      if (url && token) {
        this.client = new Redis({ url, token });
        this.isConnected = true;
        logger.info('âœ… Upstash Redis Caching client initialized successfully');
      } else {
        logger.warn('âš ï¸ Upstash Redis credentials not found. Using in-memory cache fallback.');
      }
    } catch (err) {
      logger.error('Failed to initialize Upstash Redis client:', err);
      this.client = null;
      this.isConnected = false;
    }
  }

  public isReady(): boolean {
    return Boolean(this.client && this.isConnected);
  }

  /**
   * Get cached item by key
   */
  async get<T>(key: string): Promise<T | null> {
    if (this.client) {
      try {
        const data = await this.client.get<T>(key);
        if (data !== null && data !== undefined) {
          return data;
        }
        return null;
      } catch (err) {
        logger.warn(`Redis GET failed for key: ${key}. Checking fallback.`, err);
      }
    }

    // In-memory fallback
    const memItem = this.localMemoryFallback.get(key);
    if (memItem) {
      if (Date.now() < memItem.expiresAt) {
        return memItem.value as T;
      }
      this.localMemoryFallback.delete(key);
    }
    return null;
  }

  /**
   * Set cache item with optional TTL (in seconds)
   */
  async set(key: string, value: any, ttlSeconds = 60): Promise<void> {
    if (this.client) {
      try {
        await this.client.set(key, value, { ex: ttlSeconds });
        return;
      } catch (err) {
        logger.warn(`Redis SET failed for key: ${key}. Setting in memory fallback.`, err);
      }
    }

    // In-memory fallback
    this.localMemoryFallback.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * Delete one or multiple keys
   */
  async del(keys: string | string[]): Promise<void> {
    const keyArray = Array.isArray(keys) ? keys : [keys];
    if (keyArray.length === 0) return;

    if (this.client) {
      try {
        await this.client.del(...keyArray);
      } catch (err) {
        logger.warn(`Redis DEL failed for keys: ${keyArray.join(', ')}`, err);
      }
    }

    // Clear from fallback memory
    for (const k of keyArray) {
      this.localMemoryFallback.delete(k);
    }
  }

  /**
   * Delete all keys matching a wildcard pattern (e.g. 'dsms:requests:*')
   */
  async delPattern(pattern: string): Promise<void> {
    if (this.client) {
      try {
        const keys = await this.client.keys(pattern);
        if (keys && keys.length > 0) {
          await this.client.del(...keys);
        }
      } catch (err) {
        logger.warn(`Redis keys scan failed for pattern: ${pattern}`, err);
      }
    }

    // Clean memory fallback
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    for (const k of this.localMemoryFallback.keys()) {
      if (regex.test(k)) {
        this.localMemoryFallback.delete(k);
      }
    }
  }

  /**
   * Cache-Aside Helper: Retrieve from cache or execute fetcher and store result
   */
  async wrap<T>(key: string, ttlSeconds: number, fetcher: () => Promise<T>): Promise<T> {
    try {
      const cached = await this.get<T>(key);
      if (cached !== null && cached !== undefined) {
        return cached;
      }
    } catch (err) {
      logger.warn(`Cache wrap read failed for ${key}, falling back to fetcher`, err);
    }

    const freshData = await fetcher();

    // Cache the fresh data in background
    if (freshData !== undefined && freshData !== null) {
      this.set(key, freshData, ttlSeconds).catch((err) => {
        logger.warn(`Background cache write failed for ${key}`, err);
      });
    }

    return freshData;
  }

  // ==========================================
  // BUSINESS INVALIDATION SHORTCUTS
  // ==========================================

  /**
   * Invalidate Admin dashboard statistics
   */
  async invalidateAdminStats(): Promise<void> {
    await this.del(CACHE_KEYS.ADMIN_STATS);
  }

  /**
   * Invalidate cached user requests
   */
  async invalidateUserRequests(userId?: string): Promise<void> {
    if (userId) {
      await this.delPattern(`dsms:requests:user:${userId}:*`);
    } else {
      await this.delPattern('dsms:requests:user:*');
    }
  }

  /**
   * Invalidate single request detail and related views
   */
  async invalidateRequest(requestId: string, userId?: string): Promise<void> {
    await Promise.all([
      this.del(CACHE_KEYS.REQUEST_DETAIL(requestId)),
      this.invalidateAdminStats(),
      userId ? this.invalidateUserRequests(userId) : this.invalidateUserRequests(),
    ]);
  }

  /**
   * Invalidate user or admin profile
   */
  async invalidateProfile(userId: string): Promise<void> {
    await this.del(CACHE_KEYS.USER_PROFILE(userId));
  }
}

export const cacheService = new CacheService();
export default cacheService;
