import { MessageStatus, MessageType, Role } from '@prisma/client';
import prisma from '../../config/prisma.js';
import { ApiError } from '../../utils/apiError.js';
import { AuthenticatedUser } from '../../types/express.js';
import { uploadBufferToCloudinary } from '../../utils/cloudinary.js';
import { isUserOnline, isAnyAdminOnline } from '../../sockets/socket.server.js';

export interface GetMessagesOptions {
  limit?: number;
  cursor?: string; // Message ID for cursor pagination
}

export interface PostMessageInput {
  content: string;
  messageType?: MessageType;
  metadata?: any;
  status?: MessageStatus;
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

  const isDeletedForEveryone = Boolean(msg.metadata?.isDeletedForEveryone);

  return {
    ...rest,
    sender,
    isDeletedForEveryone,
    content: isDeletedForEveryone ? "This message was deleted" : rest.content,
  };
};

export class ChatService {
  /**
   * Get total unread message count across all conversations for the user/admin
   */
  async getUnreadCount(user: AuthenticatedUser) {
    if (user.role === Role.ADMIN) {
      const count = await prisma.message.count({
        where: {
          senderRole: Role.USER,
          status: { in: [MessageStatus.SENT, MessageStatus.DELIVERED] },
          conversation: {
            request: {
              auditLogs: {
                none: {
                  action: 'REQUEST_DELETED_FOR_ADMIN',
                  actorId: user.id,
                },
              },
            },
          },
        },
      });
      return { unreadCount: count };
    }

    const count = await prisma.message.count({
      where: {
        senderRole: Role.ADMIN,
        status: { in: [MessageStatus.SENT, MessageStatus.DELIVERED] },
        conversation: {
          request: {
            userId: user.id,
            auditLogs: {
              none: {
                action: 'REQUEST_DELETED_FOR_USER',
                actorId: user.id,
              },
            },
          },
        },
      },
    });

    return { unreadCount: count };
  }

  /**
   * Fetch conversation messages for a request with strict authorization
   */
  async getConversationMessages(
    requestId: string,
    user: AuthenticatedUser,
    options: GetMessagesOptions = {}
  ) {
    // 1. Single roundtrip: Fetch conversation and verify request authorization simultaneously
    const conversation = await prisma.conversation.findUnique({
      where: { requestId },
      select: {
        id: true,
        request: {
          select: { id: true, userId: true },
        },
      },
    });

    if (!conversation || !conversation.request) {
      throw new ApiError(404, 'Conversation or request not found.');
    }

    if (user.role !== Role.ADMIN && conversation.request.userId !== user.id) {
      throw new ApiError(403, 'Forbidden: You do not have permission to view this chat.');
    }

    const limit = Math.min(options.limit || 50, 100);

    // 2. Query messages with cursor-based pagination
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

    // Filter out messages that this user deleted for themselves ('Delete for me')
    const visibleMessages = messages.filter((msg) => {
      const meta = msg.metadata as any;
      if (meta && Array.isArray(meta.deletedFor) && meta.deletedFor.includes(user.id)) {
        return false;
      }
      return true;
    });

    const hasMore = visibleMessages.length > limit;
    const items = hasMore ? visibleMessages.slice(0, limit) : visibleMessages;
    // Capture cursor of the oldest message in this batch BEFORE reversing!
    const nextCursor = hasMore ? items[items.length - 1].id : null;
    const counterpartOnline =
      user.role === Role.ADMIN
        ? isUserOnline(conversation.request.userId)
        : isAnyAdminOnline();

    return {
      conversationId: conversation.id,
      messages: [...items].reverse().map(formatMessageSender), // chronologically ordered (oldest to newest)
      nextCursor,
      isCounterpartOnline: counterpartOnline,
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
      const ext = file.originalname.includes('.')
        ? `.${file.originalname.split('.').pop()}`
        : '';
      const baseName = file.originalname
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .slice(0, 40);
      const customPublicId = `${baseName}_${Date.now()}${ext}`;

      const uploadRes = await uploadBufferToCloudinary(
        file.buffer,
        'document-system/chat-files',
        { resourceType: 'auto', publicId: customPublicId }
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
        status: data.status || MessageStatus.SENT,
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

    // Mark messages sent by the counterpart as READ (Admin marks USER messages, User marks ADMIN messages)
    const targetSenderRole = isAdmin ? Role.USER : Role.ADMIN;
    const result = await prisma.message.updateMany({
      where: {
        conversationId: request.conversation.id,
        senderRole: targetSenderRole,
        status: { in: [MessageStatus.SENT, MessageStatus.DELIVERED] },
      },
      data: {
        status: MessageStatus.READ,
        readAt: new Date(),
      },
    });

    return result;
  }

  /**
   * Delete a message (WhatsApp style: 'for_me' or 'for_everyone')
   */
  async deleteMessage(
    user: AuthenticatedUser,
    requestId: string,
    messageId: string,
    deleteType: 'for_me' | 'for_everyone'
  ) {
    // 1. Verify access to request
    const request = await prisma.documentRequest.findUnique({
      where: { id: requestId },
      select: { id: true, userId: true },
    });

    if (!request) {
      throw new ApiError(404, 'Document request not found.');
    }

    if (user.role !== Role.ADMIN && request.userId !== user.id) {
      throw new ApiError(403, 'Forbidden: You do not have permission to delete messages in this chat.');
    }

    // 2. Fetch target message
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: true,
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

    if (!message) {
      throw new ApiError(404, 'Message not found.');
    }

    if (message.conversation?.requestId !== requestId) {
      throw new ApiError(400, 'Message does not belong to this request conversation.');
    }

    const currentMeta = (message.metadata as any) || {};

    if (deleteType === 'for_everyone') {
      // Only message sender or Admin can delete for everyone
      if (user.role !== Role.ADMIN && message.senderId !== user.id) {
        throw new ApiError(403, 'You can only delete your own messages for everyone.');
      }

      const updated = await prisma.message.update({
        where: { id: messageId },
        data: {
          content: 'This message was deleted',
          metadata: {
            ...currentMeta,
            isDeletedForEveryone: true,
            deletedAt: new Date().toISOString(),
            deletedBy: user.id,
          },
        },
        include: {
          userSender: { select: { id: true, fullName: true, avatarUrl: true } },
          adminSender: { select: { id: true, fullName: true, avatarUrl: true } },
        },
      });

      return {
        type: 'for_everyone' as const,
        messageId,
        message: formatMessageSender(updated),
      };
    } else {
      // 'for_me' - add user.id to deletedFor
      const deletedFor: string[] = Array.isArray(currentMeta.deletedFor)
        ? [...currentMeta.deletedFor]
        : [];

      if (!deletedFor.includes(user.id)) {
        deletedFor.push(user.id);
      }

      await prisma.message.update({
        where: { id: messageId },
        data: {
          metadata: {
            ...currentMeta,
            deletedFor,
          },
        },
      });

      return {
        type: 'for_me' as const,
        messageId,
      };
    }
  }

  /**
   * Clear all messages in a conversation for the caller only ("Clear chat for me").
   * The counterpart account retains all messages intact.
   */
  async clearConversationMessages(user: AuthenticatedUser, requestId: string) {
    const conversation = await prisma.conversation.findUnique({
      where: { requestId },
      include: {
        request: { select: { id: true, userId: true } },
      },
    });

    if (!conversation || !conversation.request) {
      throw new ApiError(404, 'Conversation or request not found.');
    }

    if (user.role !== Role.ADMIN && conversation.request.userId !== user.id) {
      throw new ApiError(403, 'Forbidden: You do not have permission to clear this chat.');
    }

    // Fetch all existing messages in this conversation
    const messages = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      select: { id: true, metadata: true },
    });

    if (messages.length > 0) {
      const chunkSize = 50;
      for (let i = 0; i < messages.length; i += chunkSize) {
        const chunk = messages.slice(i, i + chunkSize);
        const updates = chunk.map((msg) => {
          const currentMeta = (msg.metadata as any) || {};
          const deletedFor = Array.isArray(currentMeta.deletedFor)
            ? [...currentMeta.deletedFor]
            : [];
          if (!deletedFor.includes(user.id)) {
            deletedFor.push(user.id);
          }
          return prisma.message.update({
            where: { id: msg.id },
            data: {
              metadata: {
                ...currentMeta,
                deletedFor,
              },
            },
          });
        });
        await prisma.$transaction(updates);
      }
    }

    return {
      success: true,
      clearedCount: messages.length,
      message: 'Chat cleared successfully for your account',
    };
  }
}

export const chatService = new ChatService();
export default chatService;
