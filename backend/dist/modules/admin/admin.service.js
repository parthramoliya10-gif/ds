"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminService = exports.AdminService = void 0;
const client_1 = require("@prisma/client");
const prisma_js_1 = __importDefault(require("../../config/prisma.js"));
class AdminService {
    /**
     * Aggregate complete dashboard metrics for Admin Portal
     */
    async getDashboardStats() {
        const [totalRequests, pendingRequests, quotedRequests, inProgressRequests, documentUploadedRequests, completedRequests, cancelledRequests, totalUsers, totalAdmins, blockedUsers, successfulPaymentsAggregate, pendingPaymentsAggregate, recentRequests, recentPayments,] = await Promise.all([
            // 1. Request status counts
            prisma_js_1.default.documentRequest.count(),
            prisma_js_1.default.documentRequest.count({ where: { status: client_1.RequestStatus.PENDING } }),
            prisma_js_1.default.documentRequest.count({ where: { status: client_1.RequestStatus.QUOTED } }),
            prisma_js_1.default.documentRequest.count({ where: { status: client_1.RequestStatus.IN_PROGRESS } }),
            prisma_js_1.default.documentRequest.count({ where: { status: client_1.RequestStatus.DOCUMENT_UPLOADED } }),
            prisma_js_1.default.documentRequest.count({ where: { status: client_1.RequestStatus.COMPLETED } }),
            prisma_js_1.default.documentRequest.count({ where: { status: client_1.RequestStatus.CANCELLED } }),
            // 2. User & Admin counts from separate tables
            prisma_js_1.default.user.count(),
            prisma_js_1.default.admin.count(),
            prisma_js_1.default.user.count({ where: { isBlocked: true } }),
            // 3. Financial aggregates
            prisma_js_1.default.payment.aggregate({
                where: { status: client_1.PaymentStatus.SUCCESS },
                _sum: { amount: true },
                _count: true,
            }),
            prisma_js_1.default.payment.aggregate({
                where: { status: client_1.PaymentStatus.PENDING },
                _sum: { amount: true },
                _count: true,
            }),
            // 4. Recent Requests (latest 5)
            prisma_js_1.default.documentRequest.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            fullName: true,
                            avatarUrl: true,
                        },
                    },
                    quotations: {
                        orderBy: { version: 'desc' },
                        take: 1,
                        select: {
                            id: true,
                            version: true,
                            totalAmount: true,
                            status: true,
                        },
                    },
                },
            }),
            // 5. Recent Payments (latest 5)
            prisma_js_1.default.payment.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            fullName: true,
                        },
                    },
                    request: {
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                },
            }),
        ]);
        const totalRevenueCents = successfulPaymentsAggregate._sum.amount || 0;
        const pendingRevenueCents = pendingPaymentsAggregate._sum.amount || 0;
        return {
            requests: {
                total: totalRequests,
                pending: pendingRequests,
                quoted: quotedRequests,
                inProgress: inProgressRequests,
                documentUploaded: documentUploadedRequests,
                completed: completedRequests,
                cancelled: cancelledRequests,
            },
            users: {
                totalUsers,
                totalAdmins,
                blockedUsers,
            },
            finances: {
                currency: 'USD',
                totalRevenue: {
                    cents: totalRevenueCents,
                    dollars: totalRevenueCents / 100,
                    transactionCount: successfulPaymentsAggregate._count,
                },
                pendingRevenue: {
                    cents: pendingRevenueCents,
                    dollars: pendingRevenueCents / 100,
                    pendingTransactionsCount: pendingPaymentsAggregate._count,
                },
            },
            recentRequests,
            recentPayments,
        };
    }
    /**
     * Retrieve paginated security and action audit logs
     */
    async getAuditLogs(options = {}) {
        const page = Number(options.page) || 1;
        const limit = Math.min(Number(options.limit) || 20, 100);
        const skip = (page - 1) * limit;
        const where = {};
        if (options.action) {
            where.action = { contains: options.action, mode: 'insensitive' };
        }
        if (options.actorId) {
            where.actorId = options.actorId;
        }
        const [total, logs] = await Promise.all([
            prisma_js_1.default.auditLog.count({ where }),
            prisma_js_1.default.auditLog.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    userActor: {
                        select: {
                            id: true,
                            email: true,
                            fullName: true,
                        },
                    },
                    adminActor: {
                        select: {
                            id: true,
                            email: true,
                            fullName: true,
                        },
                    },
                    request: {
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                },
            }),
        ]);
        const formattedLogs = logs.map((log) => {
            const { userActor, adminActor, ...rest } = log;
            const actor = log.actorRole === client_1.Role.ADMIN || adminActor
                ? adminActor
                    ? { ...adminActor, role: client_1.Role.ADMIN }
                    : null
                : userActor
                    ? { ...userActor, role: client_1.Role.USER }
                    : null;
            return {
                ...rest,
                actor,
            };
        });
        return {
            logs: formattedLogs,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}
exports.AdminService = AdminService;
exports.adminService = new AdminService();
exports.default = exports.adminService;
//# sourceMappingURL=admin.service.js.map