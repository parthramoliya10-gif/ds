"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.otpStore = void 0;
const crypto_1 = __importDefault(require("crypto"));
const apiError_js_1 = require("../../utils/apiError.js");
const logger_js_1 = __importDefault(require("../../utils/logger.js"));
class OtpStore {
    store = new Map();
    OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
    RESEND_COOLDOWN_MS = 30 * 1000; // 30 seconds
    MAX_ATTEMPTS = 5;
    constructor() {
        // Periodically clean up expired tokens every 5 minutes
        setInterval(() => this.cleanupExpired(), 5 * 60 * 1000);
    }
    getKey(email, type) {
        return `${email.trim().toLowerCase()}_${type}`;
    }
    /**
     * Generates and stores a secure 6-digit OTP
     */
    createOtp(email, type = 'SIGNUP', data) {
        const key = this.getKey(email, type);
        const now = Date.now();
        const existing = this.store.get(key);
        if (existing && now - existing.lastSentAt < this.RESEND_COOLDOWN_MS) {
            const waitSeconds = Math.ceil((this.RESEND_COOLDOWN_MS - (now - existing.lastSentAt)) / 1000);
            throw new apiError_js_1.ApiError(429, `Please wait ${waitSeconds} seconds before requesting a new code.`);
        }
        // Generate cryptographic 6-digit numeric OTP (100000 - 999999)
        const code = crypto_1.default.randomInt(100000, 1000000).toString();
        const expiresAtMs = now + this.OTP_TTL_MS;
        this.store.set(key, {
            code,
            email: email.trim().toLowerCase(),
            type,
            expiresAt: expiresAtMs,
            lastSentAt: now,
            attempts: 0,
            data: data || {},
        });
        logger_js_1.default.info(`[OtpStore] Created 6-digit OTP for ${email} (Type: ${type}, TTL: 10m)`);
        return {
            code,
            expiresAt: new Date(expiresAtMs),
        };
    }
    /**
     * Verifies an OTP code
     */
    verifyOtp(email, code, type = 'SIGNUP') {
        const key = this.getKey(email, type);
        const record = this.store.get(key);
        if (!record) {
            throw new apiError_js_1.ApiError(400, 'No active verification code found for this email. Please request a new code.');
        }
        // Check expiration
        if (Date.now() > record.expiresAt) {
            this.store.delete(key);
            throw new apiError_js_1.ApiError(400, 'Verification code has expired. Please request a new code.');
        }
        // Check brute force attempts
        if (record.attempts >= this.MAX_ATTEMPTS) {
            this.store.delete(key);
            throw new apiError_js_1.ApiError(429, 'Too many incorrect attempts. This code has been invalidated. Please request a new code.');
        }
        // Check code match (constant time comparison)
        const recordBuffer = Buffer.from(record.code);
        const inputBuffer = Buffer.from(code.trim());
        const isMatch = recordBuffer.length === inputBuffer.length &&
            crypto_1.default.timingSafeEqual(recordBuffer, inputBuffer);
        if (!isMatch) {
            record.attempts += 1;
            const remaining = this.MAX_ATTEMPTS - record.attempts;
            throw new apiError_js_1.ApiError(400, `Invalid verification code. ${remaining} attempts remaining.`);
        }
        // Code matched! Remove from store to prevent reuse
        const storedData = record.data;
        this.store.delete(key);
        logger_js_1.default.info(`[OtpStore] Successfully verified and consumed OTP for ${email} (Type: ${type})`);
        return {
            success: true,
            data: storedData,
        };
    }
    /**
     * Cleans up expired entries
     */
    cleanupExpired() {
        const now = Date.now();
        for (const [key, record] of this.store.entries()) {
            if (now > record.expiresAt) {
                this.store.delete(key);
            }
        }
    }
}
exports.otpStore = new OtpStore();
exports.default = exports.otpStore;
//# sourceMappingURL=otp.store.js.map