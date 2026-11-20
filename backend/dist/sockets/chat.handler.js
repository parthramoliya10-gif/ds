"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerChatHandlers = void 0;
const client_1 = require("@prisma/client");
const prisma_js_1 = __importDefault(require("../config/prisma.js"));
const socketEvents_js_1 = __importDefault(require("../constants/socketEvents.js"));
const chat_service_js_1 = require("../modules/chat/chat.service.js");
const socket_server_js_1 = require("./socket.server.js");
const logger_js_1 = __importDefault(require("../utils/logger.js"));
const registerChatHandlers = (io, socket) => {
    const currentUser = socket.data.user;
    /**
     * 1. SEND_MESSAGE: User or Admin sends a real-time message
     */
    socket.on(socketEvents_js_1.default.SEND_MESSAGE, async (payload, callback) => {
        try {
            const { requestId, content, messageType, metadata } = payload || {};
            if (!requestId || !content?.trim()) {
                if (callback)
                    callback({ success: false, error: 'requestId and non-empty content are required.' });
                return;
            }
            const roomName = `request:${requestId}`;
            if (!socket.rooms.has(roomName)) {
                const errorMsg = 'Cannot send message: You have not joined this request room.';
                if (callback)
                    callback({ success: false, error: errorMsg });
                return;
            }
            // Determine if counterpart is online or active in room
            const request = await prisma_js_1.default.documentRequest.findUnique({
                where: { id: requestId },
                select: { userId: true },
            });
            let recipientOnline = false;
            if (currentUser.role === client_1.Role.ADMIN) {
                recipientOnline = request ? (0, socket_server_js_1.isUserOnline)(request.userId) : false;
            }
            else {
                recipientOnline = (0, socket_server_js_1.isAnyAdminOnline)();
            }
            const roomSockets = await io.in(roomName).fetchSockets();
            const recipientInRoom = roomSockets.some((s) => s.data.user?.id !== currentUser.id);
            let initialStatus = client_1.MessageStatus.SENT;
            if (recipientInRoom || recipientOnline) {
                initialStatus = client_1.MessageStatus.DELIVERED;
            }
            const savedMessage = await chat_service_js_1.chatService.postMessage(currentUser, requestId, {
                content: content.trim(),
                messageType,
                metadata,
                status: initialStatus,
            });
            io.to(roomName).emit(socketEvents_js_1.default.NEW_MESSAGE, savedMessage);
            if (callback) {
                callback({ success: true, message: savedMessage });
            }
        }
        catch (error) {
            logger_js_1.default.error('Error handling send_message event:', error);
            if (callback) {
                callback({ success: false, error: error.message || 'Failed to send message.' });
            }
        }
    });
    /**
     * 2. MESSAGE_DELIVERED: Recipient acknowledges delivery (2 ticks)
     * Enforces room membership, prevents sender from self-marking, and prevents downgrading READ -> DELIVERED
     */
    socket.on(socketEvents_js_1.default.MESSAGE_DELIVERED, async (payload) => {
        try {
            const { messageId, requestId } = payload || {};
            if (!messageId || !requestId)
                return;
            const roomName = `request:${requestId}`;
            if (!socket.rooms.has(roomName))
                return;
            const deliveredAt = new Date();
            const result = await prisma_js_1.default.message.updateMany({
                where: {
                    id: messageId,
                    senderId: { not: currentUser.id },
                    status: client_1.MessageStatus.SENT,
                    conversation: { requestId },
                },
                data: {
                    status: client_1.MessageStatus.DELIVERED,
                    deliveredAt,
                },
            });
            if (result.count > 0) {
                io.to(roomName).emit(socketEvents_js_1.default.MESSAGE_STATUS_UPDATE, {
                    id: messageId,
                    status: client_1.MessageStatus.DELIVERED,
                    deliveredAt,
                });
            }
        }
        catch (error) {
            logger_js_1.default.error('Error handling message_delivered event:', error);
        }
    });
    /**
     * 3. MARK_READ: Recipient opens chat / reads messages (2 blue ticks)
     * Enforces room membership before marking messages read
     */
    socket.on(socketEvents_js_1.default.MARK_READ, async (payload) => {
        try {
            const { requestId } = payload || {};
            if (!requestId)
                return;
            const roomName = `request:${requestId}`;
            if (!socket.rooms.has(roomName))
                return;
            const result = await chat_service_js_1.chatService.markMessagesAsRead(currentUser.id, requestId);
            if (result.count > 0) {
                io.to(roomName).emit(socketEvents_js_1.default.MESSAGES_READ, {
                    requestId,
                    readerId: currentUser.id,
                    readAt: new Date(),
                });
            }
        }
        catch (error) {
            logger_js_1.default.error('Error handling mark_read event:', error);
        }
    });
    /**
     * 4. TYPING_START: "Admin is typing..." or "User is typing..."
     */
    socket.on(socketEvents_js_1.default.TYPING_START, (payload) => {
        if (!payload?.requestId)
            return;
        const roomName = `request:${payload.requestId}`;
        if (!socket.rooms.has(roomName))
            return;
        socket.to(roomName).emit(socketEvents_js_1.default.USER_TYPING, {
            requestId: payload.requestId,
            userId: currentUser.id,
            fullName: currentUser.fullName || (currentUser.role === client_1.Role.ADMIN ? 'Admin' : 'User'),
            role: currentUser.role,
            isTyping: true,
        });
    });
    /**
     * 5. TYPING_STOP: Stop typing indicator
     */
    socket.on(socketEvents_js_1.default.TYPING_STOP, (payload) => {
        if (!payload?.requestId)
            return;
        const roomName = `request:${payload.requestId}`;
        if (!socket.rooms.has(roomName))
            return;
        socket.to(roomName).emit(socketEvents_js_1.default.USER_TYPING, {
            requestId: payload.requestId,
            userId: currentUser.id,
            isTyping: false,
        });
    });
};
exports.registerChatHandlers = registerChatHandlers;
exports.default = exports.registerChatHandlers;
//# sourceMappingURL=chat.handler.js.map