import { MessageStatus, MessageType, Role } from '@prisma/client';
import prisma from '../../config/prisma.js';
import { ApiError } from '../../utils/apiError.js';
import { AuthenticatedUser } from '../../types/express.js';
import { uploadBufferToCloudinary } from '../../utils/cloudinary.js';

export interface GetMessagesOptions {
  limit?: number;
  cursor?: string; // Message ID for cursor pagination
}

export interface PostMessageInput {
  content: string;
  messageType?: MessageType;
  metadata?: any;
}

const formatMessageSender = (msg: any) => {
  const { userSender, adminSender, ...rest } = msg;
  const sender =
    msg.senderRole === Role.ADMIN
      ? adminSender
        ? { ...adminSender, role: Role.ADMIN }
        : null
      : userSender
      ? { ...userSender, role: Role.USER }
      : null;

  return {
    ...rest,
    sender,
  };
};

export class ChatService {
  /**
   * Fetch conversation messages for a request with strict authorization
   */
  async getConversationMessages(
    requestId: string,
    user: AuthenticatedUser,
    options: GetMessagesOptions = {}
  ) {
    // 1. Verify access to this request
    const request = await prisma.documentRequest.findUnique({
      where: { id: requestId },
      select: { id: true, userId: true },
    });

    if (!request) {
      throw new ApiError(404, 'Document request not found.');
    }

    if (user.role !== Role.ADMIN && request.userId !== user.id) {
      throw new ApiError(403, 'Forbidden: You do not have permission to view this chat.');
    }

    // 2. Find conversation
    const conversation = await prisma.conversation.findUnique({
      where: { requestId },
      select: { id: true },
    });

    if (!conversation) {
      throw new ApiError(404, 'Conversation not found for this request.');
    }

    const limit = Math.min(options.limit || 50, 100);

    // 3. Query messages with cursor-based pagination
    const messages = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      take: limit + 1,
      ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      include: {
        userSender: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        adminSender: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    const hasMore = messages.length > limit;
    const items = hasMore ? messages.slice(0, limit) : messages;
    // Capture cursor of the oldest message in this batch BEFORE reversing!
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return {
      conversationId: conversation.id,
      messages: [...items].reverse().map(formatMessageSender), // chronologically ordered (oldest to newest)
      nextCursor,
    };
  }

  /**
   * Post a new message via REST (supports optional file attachments)
   */
  async postMessage(
    user: AuthenticatedUser,
    requestId: string,
    data: PostMessageInput,
    file?: Express.Multer.File
  ) {
    const request = await prisma.documentRequest.findUnique({
      where: { id: requestId },
      include: { conversation: true },
    });

    if (!request) {
      throw new ApiError(404, 'Document request not found.');
    }

    if (user.role !== Role.ADMIN && request.userId !== user.id) {
      throw new ApiError(403, 'Forbidden: You cannot post messages in this conversation.');
    }

    let conversation = request.conversation;
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { requestId },
      });
    }

    let messageType = data.messageType || MessageType.TEXT;
    let metadata = data.metadata || {};

    // If file attached in chat, upload to Cloudinary
    if (file) {
      const uploadRes = await uploadBufferToCloudinary(
        file.buffer,
        'document-system/chat-files',
        { resourceType: 'auto' }
      );
      messageType = MessageType.FILE;
      metadata = {
        ...metadata,
        fileUrl: uploadRes.secureUrl,
        publicId: uploadRes.publicId,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
      };
    }

    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: user.id,
        senderRole: user.role,
        ...(user.role === Role.ADMIN
          ? { adminSenderId: user.id }
          : { userSenderId: user.id }),
        messageType,
        content: data.content || (file ? `Shared a file: ${file.originalname}` : ''),
        metadata,
        status: MessageStatus.SENT,
      },
      include: {
        userSender: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        adminSender: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return formatMessageSender(message);
  }

  /**
   * Mark all unread messages in conversation as READ (WhatsApp blue ticks)
   * Enforces strict ownership / admin authorization
   */
  async markMessagesAsRead(userId: string, requestId: string, userRole?: Role) {
    const request = await prisma.documentRequest.findUnique({
      where: { id: requestId },
      select: { userId: true, conversation: { select: { id: true } } },
    });

    if (!request || !request.conversation) {
      return { count: 0 };
    }

    const isAdmin =
      userRole === Role.ADMIN ||
      (userRole === undefined && Boolean(await prisma.admin.findUnique({ where: { id: userId } })));

    if (!isAdmin && request.userId !== userId) {
      throw new ApiError(403, 'Forbidden: You cannot modify read status for this conversation.');
    }

    // Mark messages as READ if sender is NOT the current user
    const result = await prisma.message.updateMany({
      where: {
        conversationId: request.conversation.id,
        senderId: { not: userId },
        status: { in: [MessageStatus.SENT, MessageStatus.DELIVERED] },
      },
      data: {
        status: MessageStatus.READ,
        readAt: new Date(),
      },
    });

    return result;
  }
}

export const chatService = new ChatService();
export default chatService;
