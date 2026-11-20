"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatController = exports.ChatController = void 0;
const chat_service_js_1 = __importDefault(require("./chat.service.js"));
const apiResponse_js_1 = require("../../utils/apiResponse.js");
const apiError_js_1 = require("../../utils/apiError.js");
const socket_server_js_1 = require("../../sockets/socket.server.js");
const socketEvents_js_1 = __importDefault(require("../../constants/socketEvents.js"));
class ChatController {
    /**
     * GET /api/v1/chat/unread-count
     * Fetch total unread message count across all conversations
     */
    async getUnreadCount(req, res, next) {
        try {
            if (!req.user) {
                throw new apiError_js_1.ApiError(401, 'Unauthorized');
            }
            const countData = await chat_service_js_1.default.getUnreadCount(req.user);
            (0, apiResponse_js_1.sendResponse)({
                res,
                statusCode: 200,
                message: 'Unread message count retrieved successfully',
                data: countData,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/v1/chat/:requestId/messages
     * Fetch conversation history
     */
    async getMessages(req, res, next) {
        try {
            if (!req.user) {
                throw new apiError_js_1.ApiError(401, 'Unauthorized');
            }
            const requestId = req.params.requestId;
            const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
            const cursor = req.query.cursor;
            const history = await chat_service_js_1.default.getConversationMessages(requestId, req.user, {
                limit,
                cursor,
            });
            (0, apiResponse_js_1.sendResponse)({
                res,
                statusCode: 200,
                message: 'Chat history retrieved successfully',
                data: history,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/v1/chat/:requestId/messages
     * Post message via REST with optional file upload
     */
    async postMessage(req, res, next) {
        try {
            if (!req.user) {
                throw new apiError_js_1.ApiError(401, 'Unauthorized');
            }
            const requestId = req.params.requestId;
            const file = req.file;
            const message = await chat_service_js_1.default.postMessage(req.user, requestId, req.body, file);
            // Broadcast to active Socket.IO room so clients see REST/file messages live
            (0, socket_server_js_1.emitToRequestRoom)(requestId, socketEvents_js_1.default.NEW_MESSAGE, message);
            (0, apiResponse_js_1.sendResponse)({
                res,
                statusCode: 201,
                message: 'Message sent successfully',
                data: message,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * PATCH /api/v1/chat/:requestId/read
     * Mark all unread messages as READ
     */
    async markRead(req, res, next) {
        try {
            if (!req.user) {
                throw new apiError_js_1.ApiError(401, 'Unauthorized');
            }
            const requestId = req.params.requestId;
            const result = await chat_service_js_1.default.markMessagesAsRead(req.user.id, requestId, req.user.role);
            if (result.count > 0) {
                (0, socket_server_js_1.emitToRequestRoom)(requestId, socketEvents_js_1.default.MESSAGES_READ, {
                    requestId,
                    readerId: req.user.id,
                    readAt: new Date(),
                });
            }
            (0, apiResponse_js_1.sendResponse)({
                res,
                statusCode: 200,
                message: 'Messages marked as read',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * DELETE /api/v1/chat/:requestId/messages/:messageId
     * WhatsApp style deletion: 'for_me' | 'for_everyone'
     */
    async deleteMessage(req, res, next) {
        try {
            if (!req.user) {
                throw new apiError_js_1.ApiError(401, 'Unauthorized');
            }
            const requestId = req.params.requestId;
            const messageId = req.params.messageId;
            const deleteType = req.query.type || req.body?.type || 'for_me';
            if (deleteType !== 'for_me' && deleteType !== 'for_everyone') {
                throw new apiError_js_1.ApiError(400, "Invalid delete type. Must be 'for_me' or 'for_everyone'.");
            }
            const result = await chat_service_js_1.default.deleteMessage(req.user, requestId, messageId, deleteType);
            // If deleted for everyone, broadcast to the request room
            if (result.type === 'for_everyone') {
                (0, socket_server_js_1.emitToRequestRoom)(requestId, socketEvents_js_1.default.MESSAGE_DELETED, {
                    requestId,
                    messageId,
                    type: 'for_everyone',
                    message: result.message,
                });
            }
            (0, apiResponse_js_1.sendResponse)({
                res,
                statusCode: 200,
                message: deleteType === 'for_everyone'
                    ? 'Message deleted for everyone'
                    : 'Message deleted for you',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ChatController = ChatController;
exports.chatController = new ChatController();
exports.default = exports.chatController;
//# sourceMappingURL=chat.controller.js.map