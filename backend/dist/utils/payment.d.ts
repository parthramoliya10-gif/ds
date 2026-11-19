interface VerifySignatureParams {
    orderId: string;
    paymentId: string;
    signature: string;
}
/**
 * Timing-safe HMAC SHA-256 verification for client checkout callbacks
 */
export declare const verifyRazorpaySignature: ({ orderId, paymentId, signature, }: VerifySignatureParams) => boolean;
/**
 * Timing-safe HMAC SHA-256 verification for server-to-server Webhook callbacks
 */
export declare const verifyRazorpayWebhookSignature: (rawBody: string | Buffer, signatureHeader: string) => boolean;
export {};
