export interface OtpRecord {
    code: string;
    email: string;
    type: 'SIGNUP' | 'LOGIN' | 'PASSWORD_RESET';
    expiresAt: number;
    lastSentAt: number;
    attempts: number;
    data?: Record<string, any>;
}
declare class OtpStore {
    private store;
    private readonly OTP_TTL_MS;
    private readonly RESEND_COOLDOWN_MS;
    private readonly MAX_ATTEMPTS;
    constructor();
    private getKey;
    /**
     * Generates and stores a secure 6-digit OTP
     */
    createOtp(email: string, type?: 'SIGNUP' | 'LOGIN' | 'PASSWORD_RESET', data?: Record<string, any>): {
        code: string;
        expiresAt: Date;
    };
    /**
     * Verifies an OTP code
     */
    verifyOtp(email: string, code: string, type?: 'SIGNUP' | 'LOGIN' | 'PASSWORD_RESET'): {
        success: boolean;
        data?: Record<string, any>;
    };
    /**
     * Cleans up expired entries
     */
    private cleanupExpired;
}
export declare const otpStore: OtpStore;
export default otpStore;
