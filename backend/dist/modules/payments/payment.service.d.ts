import { PaymentMilestone } from '@prisma/client';
export declare class PaymentService {
    /**
     * Create Razorpay order for Milestone 1 (50% Advance) or Milestone 2 (50% Final)
     */
    createPaymentOrder(userId: string, requestId: string, milestone: PaymentMilestone): Promise<{
        orderId: string;
        amount: string | number;
        currency: string;
        keyId: string;
        milestone: import(".prisma/client").$Enums.PaymentMilestone;
        paymentRecordId: string;
        quotationVersion: number;
    }>;
    /**
     * Internal shared transaction: Finalize a cryptographically verified payment
     * (Used by both client /verify and server-to-server /webhook)
     */
    private finalizeVerifiedPayment;
    /**
     * Verify Razorpay Client Checkout Signature and Trigger Milestone State Transition
     */
    verifyPayment(userId: string, params: {
        razorpayOrderId: string;
        razorpayPaymentId: string;
        razorpaySignature: string;
    }): Promise<{
        payment: {
            status: import(".prisma/client").$Enums.PaymentStatus;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            requestId: string;
            userId: string;
            currency: string;
            quotationId: string;
            milestone: import(".prisma/client").$Enums.PaymentMilestone;
            amount: number;
            razorpayOrderId: string;
            razorpayPaymentId: string | null;
            razorpaySignature: string | null;
            receiptUrl: string | null;
            paidAt: Date | null;
        };
        isDownloadUnlocked: boolean;
        requestStatus: import(".prisma/client").$Enums.RequestStatus;
    }>;
    /**
     * Process Server-to-Server Razorpay Webhook Events (HMAC Webhook Secret verified)
     */
    processWebhook(rawBody: string | Buffer, signatureHeader: string): Promise<{
        received: boolean;
        message: string;
    } | {
        received: boolean;
        message?: undefined;
    }>;
    /**
     * Get user's payment history
     */
    getUserPayments(userId: string): Promise<({
        request: {
            status: import(".prisma/client").$Enums.RequestStatus;
            id: string;
            title: string;
            isDownloadUnlocked: boolean;
        };
    } & {
        status: import(".prisma/client").$Enums.PaymentStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        requestId: string;
        userId: string;
        currency: string;
        quotationId: string;
        milestone: import(".prisma/client").$Enums.PaymentMilestone;
        amount: number;
        razorpayOrderId: string;
        razorpayPaymentId: string | null;
        razorpaySignature: string | null;
        receiptUrl: string | null;
        paidAt: Date | null;
    })[]>;
    /**
     * Admin-only: Get all payments & revenue analytics
     */
    getAllPaymentsForAdmin(): Promise<({
        user: {
            fullName: string | null;
            id: string;
            email: string;
        };
        request: {
            status: import(".prisma/client").$Enums.RequestStatus;
            id: string;
            title: string;
        };
    } & {
        status: import(".prisma/client").$Enums.PaymentStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        requestId: string;
        userId: string;
        currency: string;
        quotationId: string;
        milestone: import(".prisma/client").$Enums.PaymentMilestone;
        amount: number;
        razorpayOrderId: string;
        razorpayPaymentId: string | null;
        razorpaySignature: string | null;
        receiptUrl: string | null;
        paidAt: Date | null;
    })[]>;
    /**
     * Complete milestone payment & unlock documents (for sandbox, simulation, and client verification)
     */
    completeMilestonePayment(userId: string, requestId: string, milestone: PaymentMilestone | 'ADVANCE_50' | 'FINAL_50', transactionId?: string): Promise<{
        payment: {
            status: import(".prisma/client").$Enums.PaymentStatus;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            requestId: string;
            userId: string;
            currency: string;
            quotationId: string;
            milestone: import(".prisma/client").$Enums.PaymentMilestone;
            amount: number;
            razorpayOrderId: string;
            razorpayPaymentId: string | null;
            razorpaySignature: string | null;
            receiptUrl: string | null;
            paidAt: Date | null;
        };
        isDownloadUnlocked: boolean;
        requestStatus: import(".prisma/client").$Enums.RequestStatus;
    }>;
}
export declare const paymentService: PaymentService;
export default paymentService;
