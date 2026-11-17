import { PaymentStatus, RequestStatus, Role } from '@prisma/client';
import prisma from '../../config/prisma.js';

export interface AuditLogQueryOptions {
  page?: number;
  limit?: number;
  action?: string;
  actorId?: string;
}

export class AdminService {
  /**
   * Aggregate complete dashboard metrics for Admin Portal
   */
  async getDashboardStats() {
    const [
      totalRequests,
      pendingRequests,
      quotedRequests,
      inProgressRequests,
      documentUploadedRequests,
      completedRequests,
      cancelledRequests,
      totalUsers,
      totalAdmins,
      blockedUsers,
      successfulPaymentsAggregate,
      pendingPaymentsAggregate,
      recentRequests,
      recentPayments,
    ] = await Promise.all([
      // 1. Request status counts
      prisma.documentRequest.count(),
      prisma.documentRequest.count({ where: { status: RequestStatus.PENDING } }),
      prisma.documentRequest.count({ where: { status: RequestStatus.QUOTED } }),
      prisma.documentRequest.count({ where: { status: RequestStatus.IN_PROGRESS } }),
      prisma.documentRequest.count({ where: { status: RequestStatus.DOCUMENT_UPLOADED } }),
      prisma.documentRequest.count({ where: { status: RequestStatus.COMPLETED } }),
      prisma.documentRequest.count({ where: { status: RequestStatus.CANCELLED } }),

      // 2. User counts
      prisma.profile.count({ where: { role: Role.USER } }),
      prisma.profile.count({ where: { role: Role.ADMIN } }),
      prisma.profile.count({ where: { isBlocked: true } }),

      // 3. Financial aggregates
      prisma.payment.aggregate({
        where: { status: PaymentStatus.SUCCESS },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.payment.aggregate({
        where: { status: PaymentStatus.PENDING },
        _sum: { amount: true },
        _count: true,
      }),

      // 4. Recent Requests (latest 5)
      prisma.documentRequest.findMany({
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
      prisma.payment.findMany({
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

    const totalRevenuePaise = successfulPaymentsAggregate._sum.amount || 0;
    const pendingRevenuePaise = pendingPaymentsAggregate._sum.amount || 0;

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
        totalRevenue: {
          paise: totalRevenuePaise,
          rupees: totalRevenuePaise / 100,
          transactionCount: successfulPaymentsAggregate._count,
        },
        pendingRevenue: {
          paise: pendingRevenuePaise,
          rupees: pendingRevenuePaise / 100,
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
  async getAuditLogs(options: AuditLogQueryOptions = {}) {
    const page = Number(options.page) || 1;
    const limit = Math.min(Number(options.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (options.action) {
      where.action = { contains: options.action, mode: 'insensitive' };
    }
    if (options.actorId) {
      where.actorId = options.actorId;
    }

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: {
            select: {
              id: true,
              email: true,
              fullName: true,
              role: true,
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

    return {
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const adminService = new AdminService();
export default adminService;
