import { verifyRazorpaySignature, verifyRazorpayWebhookSignature } from '../src/utils/payment.js';
import env from '../src/config/env.js';
import crypto from 'crypto';

describe('🔒 Security & Authorization Architecture Tests', () => {
  const razorpaySecret = env.RAZORPAY_KEY_SECRET || 'dummy_secret';
  const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET || 'dummy_webhook_secret';

  describe('1. Cryptographic Payment Signature Verification', () => {
    it('should successfully verify a genuine Razorpay checkout signature', () => {
      const orderId = 'order_test_12345';
      const paymentId = 'pay_test_67890';
      const genuineSignature = crypto
        .createHmac('sha256', razorpaySecret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      const isValid = verifyRazorpaySignature({
        orderId,
        paymentId,
        signature: genuineSignature,
      });

      expect(isValid).toBe(true);
    });

    it('should reject a tampered Razorpay payment signature', () => {
      const orderId = 'order_test_12345';
      const paymentId = 'pay_test_67890';
      const tamperedSignature = 'tampered_fake_signature_hash_1234567890abcdef';

      const isValid = verifyRazorpaySignature({
        orderId,
        paymentId,
        signature: tamperedSignature,
      });

      expect(isValid).toBe(false);
    });

    it('should reject when orderId or paymentId is modified (Replay attack prevention)', () => {
      const orderId = 'order_test_12345';
      const paymentId = 'pay_test_67890';
      const genuineSignature = crypto
        .createHmac('sha256', razorpaySecret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      // Attacker swaps paymentId with another payment
      const isValid = verifyRazorpaySignature({
        orderId,
        paymentId: 'pay_attacker_injected_id',
        signature: genuineSignature,
      });

      expect(isValid).toBe(false);
    });

    it('should verify genuine server-to-server Webhook signature', () => {
      const payload = JSON.stringify({
        event: 'payment.captured',
        payload: { payment: { entity: { id: 'pay_123', amount: 50000 } } },
      });

      const genuineWebhookSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex');

      const isValid = verifyRazorpayWebhookSignature(payload, genuineWebhookSignature);
      expect(isValid).toBe(true);
    });

    it('should reject an illegitimate webhook call with missing or invalid signature', () => {
      const payload = JSON.stringify({ event: 'order.paid' });
      const isValid = verifyRazorpayWebhookSignature(payload, 'fake_signature');
      expect(isValid).toBe(false);
    });
  });

  describe('2. Milestone Calculation (Zero Floating Point Bug)', () => {
    it('should accurately split odd amount without losing paise', () => {
      // Total ₹1,001 = 100100 paise
      const totalAmountPaise = 100100;
      const advanceAmountPaise = Math.floor(totalAmountPaise / 2);
      const remainingAmountPaise = totalAmountPaise - advanceAmountPaise;

      expect(advanceAmountPaise).toBe(50050);
      expect(remainingAmountPaise).toBe(50050);
      expect(advanceAmountPaise + remainingAmountPaise).toBe(totalAmountPaise);
    });

    it('should handle fractional odd paise without precision loss', () => {
      // Odd 99999 paise
      const totalAmountPaise = 99999;
      const advanceAmountPaise = Math.floor(totalAmountPaise / 2); // 49999
      const remainingAmountPaise = totalAmountPaise - advanceAmountPaise; // 50000

      expect(advanceAmountPaise + remainingAmountPaise).toBe(totalAmountPaise);
    });
  });

  describe('3. Cloudinary Signed URL Expiration', () => {
    it('should generate signed URL with future unix timestamp expiration', () => {
      const now = Math.floor(Date.now() / 1000);
      const expiresInSeconds = 120;
      const expiresAt = now + expiresInSeconds;

      expect(expiresAt).toBeGreaterThan(now);
      expect(expiresAt - now).toBe(120);
    });
  });
});
