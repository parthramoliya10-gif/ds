import { AuthenticatedUser } from '../../types/express.js';
export interface CreateQuotationInput {
    requestId: string;
    totalAmount: number;
    terms?: string;
    estimatedDays?: number;
}
export declare class QuotationService {
    /**
     * Admin-only: Create and send a new quotation
     */
    createQuotation(adminId: string, data: CreateQuotationInput): Promise<{
        status: import(".prisma/client").$Enums.QuotationStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        requestId: string;
        version: number;
        createdByAdminId: string | null;
        totalAmount: number;
        advanceAmount: number;
        remainingAmount: number;
        currency: string;
        terms: string | null;
        estimatedDays: number | null;
    }>;
    /**
     * Get all quotation versions for a request with ownership guard
     */
    getQuotationsForRequest(requestId: string, user: AuthenticatedUser): Promise<({
        payments: {
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
        }[];
    } & {
        status: import(".prisma/client").$Enums.QuotationStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        requestId: string;
        version: number;
        createdByAdminId: string | null;
        totalAmount: number;
        advanceAmount: number;
        remainingAmount: number;
        currency: string;
        terms: string | null;
        estimatedDays: number | null;
    })[]>;
    /**
     * User accepts a quotation and initiates Milestone 1 (50% Advance Razorpay order)
     */
    acceptQuotation(userId: string, quotationId: string): Promise<{
        quotation: {
            status: import(".prisma/client").$Enums.QuotationStatus;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            requestId: string;
            version: number;
            createdByAdminId: string | null;
            totalAmount: number;
            advanceAmount: number;
            remainingAmount: number;
            currency: string;
            terms: string | null;
            estimatedDays: number | null;
        };
        paymentOrder: {
            orderId: string;
            amount: string | number;
            currency: string;
            keyId: string;
            milestone: string;
            paymentRecordId: string;
        };
    }>;
    /**
     * User rejects a quotation
     */
    rejectQuotation(userId: string, quotationId: string, reason?: string): Promise<{
        status: import(".prisma/client").$Enums.QuotationStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        requestId: string;
        version: number;
        createdByAdminId: string | null;
        totalAmount: number;
        advanceAmount: number;
        remainingAmount: number;
        currency: string;
        terms: string | null;
        estimatedDays: number | null;
    }>;
}
export declare const quotationService: QuotationService;
export default quotationService;
