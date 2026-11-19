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
const formatMessageSender = (msg) => {
    const { userSender, adminSender, ...rest } = msg;
    const sender = msg.senderRole === client_1.Role.ADMIN
        ? adminSender
            ? { ...adminSender, role: client_1.Role.ADMIN }
            : null
        : userSender
            ? { ...userSender, role: client_1.Role.USER }
            : null;
    return {
        ...rest,
        sender,
    };
};
class ChatService {
    /**
     * Fetch conversation messages for a request with strict authorization
     */
    async getConversationMessages(requestId, user, options = {}) {
        // 1. Verify access to this request
        const request = await prisma_js_1.default.documentRequest.findUnique({
            where: { id: requestId },
            select: { id: true, userId: true },
        });
        if (!request) {
            throw new apiError_js_1.ApiError(404, 'Document request not found.');
        }
        if (user.role !== client_1.Role.ADMIN && request.userId !== user.id) {
            throw new apiError_js_1.ApiError(403, 'Forbidden: You do not have permission to view this chat.');
        }
        // 2. Find conversation
        const conversation = await prisma_js_1.default.conversation.findUnique({
            where: { requestId },
            select: { id: true },
        });
        if (!conversation) {
            throw new apiError_js_1.ApiError(404, 'Conversation not found for this request.');
        }
        const limit = Math.min(options.limit || 50, 100);
        // 3. Query messages with cursor-based pagination
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
            const uploadRes = await (0, cloudinary_js_1.uploadBufferToCloudinary)(file.buffer, 'document-system/chat-files', { resourceType: 'auto' });
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
                status: client_1.MessageStatus.SENT,
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
        // Mark messages as READ if sender is NOT the current user
        const result = await prisma_js_1.default.message.updateMany({
            where: {
                conversationId: request.conversation.id,
                senderId: { not: userId },
                status: { in: [client_1.MessageStatus.SENT, client_1.MessageStatus.DELIVERED] },
            },
            data: {
                status: client_1.MessageStatus.READ,
                readAt: new Date(),
            },
        });
        return result;
    }
}
exports.ChatService = ChatService;
exports.chatService = new ChatService();
exports.default = exports.chatService;
//# sourceMappingURL=chat.service.js.map