import { RequestStatus, Role } from '@prisma/client';
import prisma from '../../config/prisma.js';
import { ApiError } from '../../utils/apiError.js';
import { uploadBufferToCloudinary } from '../../utils/cloudinary.js';
import { AuthenticatedUser } from '../../types/express.js';
import logger from '../../utils/logger.js';

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

export class RequestService {
  /**
   * Create a new document request with optional reference files
   */
  async createRequest(
    userId: string,
    data: CreateRequestInput,
    files?: Express.Multer.File[]
  ) {
    // 1. Upload reference files to Cloudinary if provided
    const uploadedFilesData: {
      fileName: string;
      fileUrl: string;
      cloudinaryPublicId: string;
      fileSize: number;
      mimeType: string;
    }[] = [];

    if (files && files.length > 0) {
      for (const file of files) {
        try {
          const uploadRes = await uploadBufferToCloudinary(
            file.buffer,
            'document-system/reference-files',
            { resourceType: 'auto' }
          );

          uploadedFilesData.push({
            fileName: file.originalname,
            fileUrl: uploadRes.secureUrl,
            cloudinaryPublicId: uploadRes.publicId,
            fileSize: file.size,
            mimeType: file.mimetype,
          });
        } catch (uploadError) {
          logger.error(`Error uploading file ${file.originalname}:`, uploadError);
          throw new ApiError(500, `File upload failed for ${file.originalname}`);
        }
      }
    }

    // 2. Atomic Database Transaction: Create Request, Conversation, Files, and Audit Log
    const newRequest = await prisma.$transaction(async (tx) => {
      // Create Document Request
      const docRequest = await tx.documentRequest.create({
        data: {
          userId,
          title: data.title,
          description: data.description,
          category: data.category || 'General Document',
          priority: data.priority || 'NORMAL',
          status: RequestStatus.PENDING,
          isDownloadUnlocked: false,
        },
      });

      // Automatically initialize 1-to-1 Conversation
      const conversation = await tx.conversation.create({
        data: {
          requestId: docRequest.id,
        },
      });

      // Insert Reference Files
      if (uploadedFilesData.length > 0) {
        await tx.requestFile.createMany({
          data: uploadedFilesData.map((f) => ({
            requestId: docRequest.id,
            ...f,
          })),
        });
      }

      // Record Audit Log
      await tx.auditLog.create({
        data: {
          actorId: userId,
          actorRole: Role.USER,
          userActorId: userId,
          requestId: docRequest.id,
          action: 'DOCUMENT_REQUEST_CREATED',
          metadata: {
            title: docRequest.title,
            referenceFilesCount: uploadedFilesData.length,
          },
        },
      });

      return {
        ...docRequest,
        conversationId: conversation.id,
      };
    }, {
      maxWait: 15000,
      timeout: 20000,
    });

    // Fetch complete request with files and conversation
    return this.getRequestById(newRequest.id, {
      id: userId,
      role: Role.USER,
      email: '',
      isBlocked: false,
    });
  }

  /**
   * Get requests for the logged-in User
   */
  async getUserRequests(userId: string, query: ListRequestsQuery) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (query.status) {
      where.status = query.status;
    }

    const [total, requests] = await Promise.all([
      prisma.documentRequest.count({ where }),
      prisma.documentRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          conversation: { select: { id: true } },
          _count: {
            select: {
              referenceFiles: true,
              quotations: true,
              payments: true,
              finalDocuments: true,
            },
          },
          quotations: {
            where: { status: 'SENT' },
            orderBy: { version: 'desc' },
            take: 1,
            select: {
              id: true,
              version: true,
              totalAmount: true,
              advanceAmount: true,
              remainingAmount: true,
              status: true,
            },
          },
        },
      }),
    ]);

    return {
      requests,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get all requests for Admin with search and filters
   */
  async getAllRequestsForAdmin(query: ListRequestsQuery) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) {
      where.status = query.status;
    }
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { user: { email: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [total, requests] = await Promise.all([
      prisma.documentRequest.count({ where }),
      prisma.documentRequest.findMany({
        where,
        skip,
        take: limit,
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
          conversation: { select: { id: true } },
          _count: {
            select: {
              referenceFiles: true,
              quotations: true,
              payments: true,
              finalDocuments: true,
            },
          },
        },
      }),
    ]);

    return {
      requests,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single request details with STRICT Authorization check
   */
  async getRequestById(requestId: string, user: AuthenticatedUser) {
    const request = await prisma.documentRequest.findUnique({
      where: { id: requestId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        referenceFiles: true,
        conversation: { select: { id: true } },
        quotations: {
          orderBy: { version: 'desc' },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
        finalDocuments: {
          orderBy: { version: 'desc' },
          select: {
            id: true,
            title: true,
            fileName: true,
            fileSize: true,
            mimeType: true,
            version: true,
            downloadCount: true,
            createdAt: true,
            // secureUrl and cloudinaryPublicId are only shown if download is unlocked or user is Admin
            secureUrl: user.role === Role.ADMIN,
            cloudinaryPublicId: user.role === Role.ADMIN,
          },
        },
      },
    });

    if (!request) {
      throw new ApiError(404, 'Document request not found.');
    }

    // STRICT IDOR SECURITY GUARD:
    // Non-admin users CANNOT access requests belonging to another user
    if (user.role !== Role.ADMIN && request.userId !== user.id) {
      throw new ApiError(403, 'Forbidden: You do not have permission to view this request.');
    }

    return request;
  }

  /**
   * Admin-only: Update request status
   */
  async updateStatus(adminId: string, requestId: string, status: RequestStatus) {
    const existing = await prisma.documentRequest.findUnique({
      where: { id: requestId },
    });

    if (!existing) {
      throw new ApiError(404, 'Document request not found.');
    }

    const updated = await prisma.documentRequest.update({
      where: { id: requestId },
      data: { status },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        actorId: adminId,
        actorRole: Role.ADMIN,
        adminActorId: adminId,
        requestId,
        action: 'REQUEST_STATUS_UPDATED',
        metadata: {
          previousStatus: existing.status,
          newStatus: status,
        },
      },
    });

    return updated;
  }

  /**
   * User can cancel their own request if it is still PENDING
   */
  async cancelRequest(userId: string, requestId: string) {
    const request = await prisma.documentRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new ApiError(404, 'Document request not found.');
    }

    if (request.userId !== userId) {
      throw new ApiError(403, 'You can only cancel your own requests.');
    }

    if (request.status !== RequestStatus.PENDING) {
      throw new ApiError(
        400,
        `Cannot cancel request in '${request.status}' status. Contact admin.`
      );
    }

    const cancelled = await prisma.documentRequest.update({
      where: { id: requestId },
      data: { status: RequestStatus.CANCELLED },
    });

    await prisma.auditLog.create({
      data: {
        actorId: userId,
        actorRole: Role.USER,
        userActorId: userId,
        requestId,
        action: 'REQUEST_CANCELLED_BY_USER',
      },
    });

    return cancelled;
  }
}

export const requestService = new RequestService();
export default requestService;
