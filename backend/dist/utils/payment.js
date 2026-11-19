"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRazorpayWebhookSignature = exports.verifyRazorpaySignature = void 0;
const crypto_1 = __importDefault(require("crypto"));
const env_js_1 = __importDefault(require("../config/env.js"));
/**
 * Timing-safe HMAC SHA-256 verification for client checkout callbacks
 */
const verifyRazorpaySignature = ({ orderId, paymentId, signature, }) => {
    if (!orderId || !paymentId || !signature) {
        return false;
    }
    const expectedSignature = crypto_1.default
        .createHmac('sha256', env_js_1.default.RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');
    // Prevent timing attacks using Buffer.compare / timingSafeEqual
    const expectedBuffer = Buffer.from(expectedSignature, 'utf-8');
    const signatureBuffer = Buffer.from(signature, 'utf-8');
    if (expectedBuffer.length !== signatureBuffer.length) {
        return false;
    }
    return crypto_1.default.timingSafeEqual(expectedBuffer, signatureBuffer);
};
exports.verifyRazorpaySignature = verifyRazorpaySignature;
/**
 * Timing-safe HMAC SHA-256 verification for server-to-server Webhook callbacks
 */
const verifyRazorpayWebhookSignature = (rawBody, signatureHeader) => {
    if (!signatureHeader || !env_js_1.default.RAZORPAY_WEBHOOK_SECRET) {
        return false;
    }
    const expectedSignature = crypto_1.default
        .createHmac('sha256', env_js_1.default.RAZORPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'utf-8');
    const signatureBuffer = Buffer.from(signatureHeader, 'utf-8');
    if (expectedBuffer.length !== signatureBuffer.length) {
        return false;
    }
    return crypto_1.default.timingSafeEqual(expectedBuffer, signatureBuffer);
};
exports.verifyRazorpayWebhookSignature = verifyRazorpayWebhookSignature;
//# sourceMappingURL=payment.js.map