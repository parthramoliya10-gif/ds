import crypto from 'crypto';
import { ApiError } from '../../utils/apiError.js';
import logger from '../../utils/logger.js';

export interface OtpRecord {
  code: string;
  email: string;
  type: 'SIGNUP' | 'LOGIN' | 'PASSWORD_RESET';
  expiresAt: number; // Unix timestamp in ms
  lastSentAt: number;
  attempts: number;
  data?: Record<string, any>;
}

class OtpStore {
  private store: Map<string, OtpRecord> = new Map();
  private readonly OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
  private readonly RESEND_COOLDOWN_MS = 30 * 1000; // 30 seconds
  private readonly MAX_ATTEMPTS = 5;

  constructor() {
    // Periodically clean up expired tokens every 5 minutes
    setInterval(() => this.cleanupExpired(), 5 * 60 * 1000);
  }

  private getKey(email: string, type: string): string {
    return `${email.trim().toLowerCase()}_${type}`;
  }

  /**
   * Generates and stores a secure 6-digit OTP
   */
  public createOtp(
    email: string,
    type: 'SIGNUP' | 'LOGIN' | 'PASSWORD_RESET' = 'SIGNUP',
    data?: Record<string, any>
  ): { code: string; expiresAt: Date } {
    const key = this.getKey(email, type);
    const now = Date.now();
    const existing = this.store.get(key);

    if (existing && now - existing.lastSentAt < this.RESEND_COOLDOWN_MS) {
      const waitSeconds = Math.ceil((this.RESEND_COOLDOWN_MS - (now - existing.lastSentAt)) / 1000);
      throw new ApiError(429, `Please wait ${waitSeconds} seconds before requesting a new code.`);
    }

    // Generate cryptographic 6-digit numeric OTP (100000 - 999999)
    const code = crypto.randomInt(100000, 1000000).toString();
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

    logger.info(`[OtpStore] Created 6-digit OTP for ${email} (Type: ${type}, TTL: 10m)`);

    return {
      code,
      expiresAt: new Date(expiresAtMs),
    };
  }

  /**
   * Verifies an OTP code
   */
  public verifyOtp(
    email: string,
    code: string,
    type: 'SIGNUP' | 'LOGIN' | 'PASSWORD_RESET' = 'SIGNUP'
  ): { success: boolean; data?: Record<string, any> } {
    const key = this.getKey(email, type);
    const record = this.store.get(key);

    if (!record) {
      throw new ApiError(400, 'No active verification code found for this email. Please request a new code.');
    }

    // Check expiration
    if (Date.now() > record.expiresAt) {
      this.store.delete(key);
      throw new ApiError(400, 'Verification code has expired. Please request a new code.');
    }

    // Check brute force attempts
    if (record.attempts >= this.MAX_ATTEMPTS) {
      this.store.delete(key);
      throw new ApiError(429, 'Too many incorrect attempts. This code has been invalidated. Please request a new code.');
    }

    // Check code match (constant time comparison)
    const recordBuffer = Buffer.from(record.code);
    const inputBuffer = Buffer.from(code.trim());

    const isMatch =
      recordBuffer.length === inputBuffer.length &&
      crypto.timingSafeEqual(recordBuffer, inputBuffer);

    if (!isMatch) {
      record.attempts += 1;
      const remaining = this.MAX_ATTEMPTS - record.attempts;
      throw new ApiError(400, `Invalid verification code. ${remaining} attempts remaining.`);
    }

    // Code matched! Remove from store to prevent reuse
    const storedData = record.data;
    this.store.delete(key);
    logger.info(`[OtpStore] Successfully verified and consumed OTP for ${email} (Type: ${type})`);

    return {
      success: true,
      data: storedData,
    };
  }

  /**
   * Cleans up expired entries
   */
  private cleanupExpired(): void {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (now > record.expiresAt) {
        this.store.delete(key);
      }
    }
  }
}

export const otpStore = new OtpStore();
export default otpStore;
