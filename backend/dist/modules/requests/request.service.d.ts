import { RequestStatus } from '@prisma/client';
import { AuthenticatedUser } from '../../types/express.js';
export interface CreateRequestInput {
    title: string;
    description: string;
    category?: string;
    priority?: string;
}
export interface ListRequestsQuery {
    page?: number;
    limit?: number;
    status?: RequestStatus;
    search?: string;
}
export declare class RequestService {
    /**
     * Create a new document request with optional reference files
     */
    createRequest(userId: string, data: CreateRequestInput, files?: Express.Multer.File[]): Promise<{
        isCounterpartOnline: boolean;
        user: {
            fullName: string | null;
            id: string;
            email: string;
            avatarUrl: string | null;
        };
        conversation: {
            id: string;
        } | null;
        quotations: {
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
        }[];
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
        referenceFiles: {
            id: string;
            createdAt: Date;
            requestId: string;
            fileName: string;
            cloudinaryPublicId: string;
            fileSize: number;
            mimeType: string;
            fileUrl: string;
        }[];
        finalDocuments: {
            id: string;
            createdAt: Date;
            title: string;
            fileName: string;
            cloudinaryPublicId: string;
            secureUrl: string;
            fileSize: number;
            mimeType: string;
            version: number;
            downloadCount: number;
        }[];
        status: import(".prisma/client").$Enums.RequestStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        title: string;
        description: string;
        category: string | null;
        priority: string;
        isDownloadUnlocked: boolean;
    }>;
    /**
     * Get requests for the logged-in User
     */
    getUserRequests(userId: string, query: ListRequestsQuery): Promise<{
        requests: any[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    /**
     * Get all requests for Admin with search and filters
     */
    getAllRequestsForAdmin(query: ListRequestsQuery, adminId?: string): Promise<{
        requests: ({
            user: {
                fullName: string | null;
                id: string;
                email: string;
                avatarUrl: string | null;
            };
            conversation: {
                id: string;
                messages: {
                    createdAt: Date;
                    senderRole: import(".prisma/client").$Enums.Role;
                    content: string;
                }[];
                _count: {
                    messages: number;
                };
            } | null;
            quotations: {
                status: import(".prisma/client").$Enums.QuotationStatus;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                requestId: string;
                version: number;
                totalAmount: number;
                advanceAmount: number;
                remainingAmount: number;
                currency: string;
                terms: string | null;
                estimatedDays: number | null;
            }[];
            payments: {
                status: import(".prisma/client").$Enums.PaymentStatus;
                id: string;
                createdAt: Date;
                requestId: string;
                currency: string;
                milestone: import(".prisma/client").$Enums.PaymentMilestone;
                amount: number;
                razorpayPaymentId: string | null;
                paidAt: Date | null;
            }[];
            _count: {
                quotations: number;
                payments: number;
                referenceFiles: number;
                finalDocuments: number;
            };
            finalDocuments: {
                id: string;
                createdAt: Date;
                title: string;
                fileName: string;
                secureUrl: string;
                fileSize: number;
                mimeType: string;
                version: number;
                downloadCount: number;
            }[];
        } & {
            status: import(".prisma/client").$Enums.RequestStatus;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            title: string;
            description: string;
            category: string | null;
            priority: string;
            isDownloadUnlocked: boolean;
        })[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    /**
     * Get single request details with STRICT Authorization check
     */
    getRequestById(requestId: string, user: AuthenticatedUser): Promise<{
        isCounterpartOnline: boolean;
        user: {
            fullName: string | null;
            id: string;
            email: string;
            avatarUrl: string | null;
        };
        conversation: {
            id: string;
        } | null;
        quotations: {
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
        }[];
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
        referenceFiles: {
            id: string;
            createdAt: Date;
            requestId: string;
            fileName: string;
            cloudinaryPublicId: string;
            fileSize: number;
            mimeType: string;
            fileUrl: string;
        }[];
        finalDocuments: {
            id: string;
            createdAt: Date;
            title: string;
            fileName: string;
            cloudinaryPublicId: string;
            secureUrl: string;
            fileSize: number;
            mimeType: string;
            version: number;
            downloadCount: number;
        }[];
        status: import(".prisma/client").$Enums.RequestStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        title: string;
        description: string;
        category: string | null;
        priority: string;
        isDownloadUnlocked: boolean;
    }>;
    /**
     * Admin-only: Update request status
     */
    updateStatus(adminId: string, requestId: string, status: RequestStatus): Promise<{
        status: import(".prisma/client").$Enums.RequestStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        title: string;
        description: string;
        category: string | null;
        priority: string;
        isDownloadUnlocked: boolean;
    }>;
    /**
     * User can cancel their own request if it is still PENDING
     */
    cancelRequest(userId: string, requestId: string): Promise<{
        status: import(".prisma/client").$Enums.RequestStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        title: string;
        description: string;
        category: string | null;
        priority: string;
        isDownloadUnlocked: boolean;
    }>;
    /**
     * Delete request for the caller's account only ("Delete for me").
     * Request is hidden from this account's dashboard, list, and chat,
     * but remains completely intact in the other account.
     */
    deleteRequestForAccount(user: AuthenticatedUser, requestId: string): Promise<{
        success: boolean;
        message: string;
        requestId: string;
    }>;
}
export declare const requestService: RequestService;
export default requestService;
