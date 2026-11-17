import crypto from 'crypto';
import env from '../config/env.js';

interface VerifySignatureParams {
  orderId: string;
  paymentId: string;
  signature: string;
}

/**
 * Timing-safe HMAC SHA-256 verification for client checkout callbacks
 */
export const verifyRazorpaySignature = ({
  orderId,
  paymentId,
  signature,
}: VerifySignatureParams): boolean => {
  if (!orderId || !paymentId || !signature) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  // Prevent timing attacks using Buffer.compare / timingSafeEqual
  const expectedBuffer = Buffer.from(expectedSignature, 'utf-8');
  const signatureBuffer = Buffer.from(signature, 'utf-8');

  if (expectedBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
};

/**
 * Timing-safe HMAC SHA-256 verification for server-to-server Webhook callbacks
 */
export const verifyRazorpayWebhookSignature = (
  rawBody: string | Buffer,
  signatureHeader: string
): boolean => {
  if (!signatureHeader || !env.RAZORPAY_WEBHOOK_SECRET) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  const expectedBuffer = Buffer.from(expectedSignature, 'utf-8');
  const signatureBuffer = Buffer.from(signatureHeader, 'utf-8');

  if (expectedBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
};
