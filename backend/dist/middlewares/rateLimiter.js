"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRateLimiter = exports.rateLimiter = void 0;
const ratelimit_1 = require("@upstash/ratelimit");
const redis_1 = require("@upstash/redis");
const env_js_1 = __importDefault(require("../config/env.js"));
const apiError_js_1 = require("../utils/apiError.js");
const logger_js_1 = __importDefault(require("../utils/logger.js"));
let redisClient = null;
let upstashRatelimit = null;
if (env_js_1.default.UPSTASH_REDIS_REST_URL && env_js_1.default.UPSTASH_REDIS_REST_TOKEN) {
    try {
        redisClient = new redis_1.Redis({
            url: env_js_1.default.UPSTASH_REDIS_REST_URL,
            token: env_js_1.default.UPSTASH_REDIS_REST_TOKEN,
        });
        upstashRatelimit = new ratelimit_1.Ratelimit({
            redis: redisClient,
            limiter: ratelimit_1.Ratelimit.slidingWindow(60, '1 m'), // 60 requests per minute per IP
            analytics: true,
            prefix: 'ratelimit',
        });
        logger_js_1.default.info('✅ Upstash Redis Rate Limiter initialized');
    }
    catch (error) {
        logger_js_1.default.warn('⚠️ Failed to initialize Upstash Redis. Falling back to local memory limiter.');
    }
}
// In-memory fallback tracking map
const memoryLimitMap = new Map();
const rateLimiter = async (req, _res, next) => {
    // Exclude healthcheck from rate limit
    if (req.path === '/health' || req.path === '/api/v1/health') {
        return next();
    }
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() ||
        req.socket.remoteAddress ||
        '127.0.0.1';
    if (upstashRatelimit) {
        try {
            const { success, limit, remaining, reset } = await upstashRatelimit.limit(clientIp);
            if (!success) {
                return next(new apiError_js_1.ApiError(429, `Too many requests. Limit: ${limit}. Try again in a minute.`));
            }
            return next();
        }
        catch (err) {
            logger_js_1.default.error('Upstash rate limit evaluation failed, continuing with request', err);
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
        return next(new apiError_js_1.ApiError(429, 'Too many requests. Please slow down and try again later.'));
    }
    current.count += 1;
    next();
};
exports.rateLimiter = rateLimiter;
/**
 * Strict authentication rate limiter: 15 requests per minute per IP
 * Specifically protects login, password reset, and OTP generation from brute-force/credential stuffing
 */
const authRateLimiter = async (req, _res, next) => {
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() ||
        req.socket.remoteAddress ||
        '127.0.0.1';
    const key = `auth_${clientIp}`;
    const now = Date.now();
    const windowMs = 60 * 1000;
    const maxAuthRequests = 15;
    const current = memoryLimitMap.get(key);
    if (!current || now > current.expiresAt) {
        memoryLimitMap.set(key, { count: 1, expiresAt: now + windowMs });
        return next();
    }
    if (current.count >= maxAuthRequests) {
        return next(new apiError_js_1.ApiError(429, 'Too many authentication attempts. Please wait 1 minute before trying again.'));
    }
    current.count += 1;
    next();
};
exports.authRateLimiter = authRateLimiter;
//# sourceMappingURL=rateLimiter.js.map