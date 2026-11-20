"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatService = exports.ChatService = void 0;
const client_1 = require("@prisma/client");
const prisma_js_1 = __importDefault(require("../../config/prisma.js"));
const apiError_js_1 = require("../../utils/apiError.js");
const cloudinary_js_1 = require("../../utils/cloudinary.js");
const socket_server_js_1 = require("../../sockets/socket.server.js");
const formatMessageSender = (msg) => {
    const { userSender, adminSender, ...rest } = msg;
    const sender = msg.senderRole === client_1.Role.ADMIN
        ? adminSender
            ? { ...adminSender, role: client_1.Role.ADMIN }
            : null
        : userSender
            ? { ...userSender, role: client_1.Role.USER }
            : null;
    const isDeletedForEveryone = Boolean(msg.metadata?.isDeletedForEveryone);
    return {
        ...rest,
        sender,
        isDeletedForEveryone,
        content: isDeletedForEveryone ? "This message was deleted" : rest.content,
    };
};
class ChatService {
    /**
     * Get total unread message count across all conversations for the user/admin
     */
    async getUnreadCount(user) {
        if (user.role === client_1.Role.ADMIN) {
            const count = await prisma_js_1.default.message.count({
                where: {
                    senderRole: client_1.Role.USER,
                    status: { in: [client_1.MessageStatus.SENT, client_1.MessageStatus.DELIVERED] },
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
        const count = await prisma_js_1.default.message.count({
            where: {
                senderRole: client_1.Role.ADMIN,
                status: { in: [client_1.MessageStatus.SENT, client_1.MessageStatus.DELIVERED] },
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
    async getConversationMessages(requestId, user, options = {}) {
        // 1. Single roundtrip: Fetch conversation and verify request authorization simultaneously
        const conversation = await prisma_js_1.default.conversation.findUnique({
            where: { requestId },
            select: {
                id: true,
                request: {
                    select: { id: true, userId: true },
                },
            },
        });
        if (!conversation || !conversation.request) {
            throw new apiError_js_1.ApiError(404, 'Conversation or request not found.');
        }
        if (user.role !== client_1.Role.ADMIN && conversation.request.userId !== user.id) {
            throw new apiError_js_1.ApiError(403, 'Forbidden: You do not have permission to view this chat.');
        }
        const limit = Math.min(options.limit || 50, 100);
        // 2. Query messages with cursor-based pagination
        const messages = await prisma_js_1.default.message.findMany({
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
            const meta = msg.metadata;
            if (meta && Array.isArray(meta.deletedFor) && meta.deletedFor.includes(user.id)) {
                return false;
            }
            return true;
        });
        const hasMore = visibleMessages.length > limit;
        const items = hasMore ? visibleMessages.slice(0, limit) : visibleMessages;
        // Capture cursor of the oldest message in this batch BEFORE reversing!
        const nextCursor = hasMore ? items[items.length - 1].id : null;
        const counterpartOnline = user.role === client_1.Role.ADMIN
            ? (0, socket_server_js_1.isUserOnline)(conversation.request.userId)
            : (0, socket_server_js_1.isAnyAdminOnline)();
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
    async postMessage(user, requestId, data, file) {
        const request = await prisma_js_1.default.documentRequest.findUnique({
            where: { id: requestId },
            include: { conversation: true },
        });
        if (!request) {
            throw new apiError_js_1.ApiError(404, 'Document request not found.');
        }
        if (user.role !== client_1.Role.ADMIN && request.userId !== user.id) {
            throw new apiError_js_1.ApiError(403, 'Forbidden: You cannot post messages in this conversation.');
        }
        let conversation = request.conversation;
        if (!conversation) {
            conversation = await prisma_js_1.default.conversation.create({
                data: { requestId },
            });
        }
        let messageType = data.messageType || client_1.MessageType.TEXT;
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
            const uploadRes = await (0, cloudinary_js_1.uploadBufferToCloudinary)(file.buffer, 'document-system/chat-files', { resourceType: 'auto', publicId: customPublicId });
            messageType = client_1.MessageType.FILE;
            metadata = {
                ...metadata,
                fileUrl: uploadRes.secureUrl,
                publicId: uploadRes.publicId,
                fileName: file.originalname,
                fileSize: file.size,
                mimeType: file.mimetype,
            };
        }
        const message = await prisma_js_1.default.message.create({
            data: {
                conversationId: conversation.id,
                senderId: user.id,
                senderRole: user.role,
                ...(user.role === client_1.Role.ADMIN
                    ? { adminSenderId: user.id }
                    : { userSenderId: user.id }),
                messageType,
                content: data.content || (file ? `Shared a file: ${file.originalname}` : ''),
                metadata,
                status: data.status || client_1.MessageStatus.SENT,
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
    async markMessagesAsRead(userId, requestId, userRole) {
        const request = await prisma_js_1.default.documentRequest.findUnique({
            where: { id: requestId },
            select: { userId: true, conversation: { select: { id: true } } },
        });
        if (!request || !request.conversation) {
            return { count: 0 };
        }
        const isAdmin = userRole === client_1.Role.ADMIN ||
            (userRole === undefined && Boolean(await prisma_js_1.default.admin.findUnique({ where: { id: userId } })));
        if (!isAdmin && request.userId !== userId) {
            throw new apiError_js_1.ApiError(403, 'Forbidden: You cannot modify read status for this conversation.');
        }
        // Mark messages sent by the counterpart as READ (Admin marks USER messages, User marks ADMIN messages)
        const targetSenderRole = isAdmin ? client_1.Role.USER : client_1.Role.ADMIN;
        const result = await prisma_js_1.default.message.updateMany({
            where: {
                conversationId: request.conversation.id,
                senderRole: targetSenderRole,
                status: { in: [client_1.MessageStatus.SENT, client_1.MessageStatus.DELIVERED] },
            },
            data: {
                status: client_1.MessageStatus.READ,
                readAt: new Date(),
            },
        });
        return result;
    }
    /**
     * Delete a message (WhatsApp style: 'for_me' or 'for_everyone')
     */
    async deleteMessage(user, requestId, messageId, deleteType) {
        // 1. Verify access to request
        const request = await prisma_js_1.default.documentRequest.findUnique({
            where: { id: requestId },
            select: { id: true, userId: true },
        });
        if (!request) {
            throw new apiError_js_1.ApiError(404, 'Document request not found.');
        }
        if (user.role !== client_1.Role.ADMIN && request.userId !== user.id) {
            throw new apiError_js_1.ApiError(403, 'Forbidden: You do not have permission to delete messages in this chat.');
        }
        // 2. Fetch target message
        const message = await prisma_js_1.default.message.findUnique({
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
            throw new apiError_js_1.ApiError(404, 'Message not found.');
        }
        if (message.conversation?.requestId !== requestId) {
            throw new apiError_js_1.ApiError(400, 'Message does not belong to this request conversation.');
        }
        const currentMeta = message.metadata || {};
        if (deleteType === 'for_everyone') {
            // Only message sender or Admin can delete for everyone
            if (user.role !== client_1.Role.ADMIN && message.senderId !== user.id) {
                throw new apiError_js_1.ApiError(403, 'You can only delete your own messages for everyone.');
            }
            const updated = await prisma_js_1.default.message.update({
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
                type: 'for_everyone',
                messageId,
                message: formatMessageSender(updated),
            };
        }
        else {
            // 'for_me' - add user.id to deletedFor
            const deletedFor = Array.isArray(currentMeta.deletedFor)
                ? [...currentMeta.deletedFor]
                : [];
            if (!deletedFor.includes(user.id)) {
                deletedFor.push(user.id);
            }
            await prisma_js_1.default.message.update({
                where: { id: messageId },
                data: {
                    metadata: {
                        ...currentMeta,
                        deletedFor,
                    },
                },
            });
            return {
                type: 'for_me',
                messageId,
            };
        }
    }
    /**
     * Clear all messages in a conversation for the caller only ("Clear chat for me").
     * The counterpart account retains all messages intact.
     */
    async clearConversationMessages(user, requestId) {
        const conversation = await prisma_js_1.default.conversation.findUnique({
            where: { requestId },
            include: {
                request: { select: { id: true, userId: true } },
            },
        });
        if (!conversation || !conversation.request) {
            throw new apiError_js_1.ApiError(404, 'Conversation or request not found.');
        }
        if (user.role !== client_1.Role.ADMIN && conversation.request.userId !== user.id) {
            throw new apiError_js_1.ApiError(403, 'Forbidden: You do not have permission to clear this chat.');
        }
        // Fetch all existing messages in this conversation
        const messages = await prisma_js_1.default.message.findMany({
            where: { conversationId: conversation.id },
            select: { id: true, metadata: true },
        });
        if (messages.length > 0) {
            const updates = messages.map((msg) => {
                const currentMeta = msg.metadata || {};
                const deletedFor = Array.isArray(currentMeta.deletedFor)
                    ? [...currentMeta.deletedFor]
                    : [];
                if (!deletedFor.includes(user.id)) {
                    deletedFor.push(user.id);
                }
                return prisma_js_1.default.message.update({
                    where: { id: msg.id },
                    data: {
                        metadata: {
                            ...currentMeta,
                            deletedFor,
                        },
                    },
                });
            });
            await prisma_js_1.default.$transaction(updates);
        }
        return {
            success: true,
            clearedCount: messages.length,
            message: 'Chat cleared successfully for your account',
        };
    }
}
exports.ChatService = ChatService;
exports.chatService = new ChatService();
exports.default = exports.chatService;
//# sourceMappingURL=chat.service.js.map