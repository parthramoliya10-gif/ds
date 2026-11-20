export interface AuditLogQueryOptions {
    page?: number;
    limit?: number;
    action?: string;
    actorId?: string;
}
export declare class AdminService {
    /**
     * Aggregate complete dashboard metrics for Admin Portal
     */
    getDashboardStats(): Promise<{
        requests: {
            total: number;
            pending: number;
            quoted: number;
            inProgress: number;
            documentUploaded: number;
            completed: number;
            cancelled: number;
        };
        users: {
            totalUsers: number;
            totalAdmins: number;
            blockedUsers: number;
        };
        finances: {
            currency: string;
            totalRevenue: {
                cents: number;
                dollars: number;
                transactionCount: number;
            };
            pendingRevenue: {
                cents: number;
                dollars: number;
                pendingTransactionsCount: number;
            };
        };
        recentRequests: ({
            user: {
                id: string;
                email: string;
                fullName: string | null;
                avatarUrl: string | null;
            };
            quotations: {
                status: import(".prisma/client").$Enums.QuotationStatus;
                id: string;
                version: number;
                totalAmount: number;
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
        recentPayments: ({
            user: {
                id: string;
                email: string;
                fullName: string | null;
            };
            request: {
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
        })[];
    }>;
    /**
     * Retrieve paginated security and action audit logs
     */
    getAuditLogs(options?: AuditLogQueryOptions): Promise<{
        logs: {
            actor: {
                role: "ADMIN";
                id: string;
                email: string;
                fullName: string | null;
            } | {
                role: "USER";
                id: string;
                email: string;
                fullName: string | null;
            } | null;
            request: {
                id: string;
                title: string;
            } | null;
            id: string;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            createdAt: Date;
            actorId: string | null;
            actorRole: import(".prisma/client").$Enums.Role | null;
            action: string;
            ipAddress: string | null;
            userAgent: string | null;
            userActorId: string | null;
            adminActorId: string | null;
            requestId: string | null;
        }[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
}
export declare const adminService: AdminService;
export default adminService;
