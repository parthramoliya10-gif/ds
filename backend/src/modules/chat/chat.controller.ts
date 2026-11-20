import { Request, Response, NextFunction } from 'express';
import chatService from './chat.service.js';
import { sendResponse } from '../../utils/apiResponse.js';
import { ApiError } from '../../utils/apiError.js';
import { emitToRequestRoom } from '../../sockets/socket.server.js';
import SOCKET_EVENTS from '../../constants/socketEvents.js';

export class ChatController {
  /**
   * GET /api/v1/chat/:requestId/messages
   * Fetch conversation history
   */
  async getMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Unauthorized');
      }

      const requestId = req.params.requestId as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const cursor = req.query.cursor as string | undefined;

      const history = await chatService.getConversationMessages(requestId, req.user, {
        limit,
        cursor,
      });

      sendResponse({
        res,
        statusCode: 200,
        message: 'Chat history retrieved successfully',
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/chat/:requestId/messages
   * Post message via REST with optional file upload
   */
  async postMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Unauthorized');
      }

      const requestId = req.params.requestId as string;
      const file = req.file as Express.Multer.File | undefined;
      const message = await chatService.postMessage(req.user, requestId, req.body, file);

      // Broadcast to active Socket.IO room so clients see REST/file messages live
      emitToRequestRoom(requestId, SOCKET_EVENTS.NEW_MESSAGE, message);

      sendResponse({
        res,
        statusCode: 201,
        message: 'Message sent successfully',
        data: message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/chat/:requestId/read
   * Mark all unread messages as READ
   */
  async markRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Unauthorized');
      }

      const requestId = req.params.requestId as string;
      const result = await chatService.markMessagesAsRead(req.user.id, requestId, req.user.role);

      if (result.count > 0) {
        emitToRequestRoom(requestId, SOCKET_EVENTS.MESSAGES_READ, {
          requestId,
          readerId: req.user.id,
          readAt: new Date(),
        });
      }

      sendResponse({
        res,
        statusCode: 200,
        message: 'Messages marked as read',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/chat/:requestId/messages/:messageId
   * WhatsApp style deletion: 'for_me' | 'for_everyone'
   */
  async deleteMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Unauthorized');
      }

      const requestId = req.params.requestId as string;
      const messageId = req.params.messageId as string;
      const deleteType = (req.query.type as string) || req.body?.type || 'for_me';

      if (deleteType !== 'for_me' && deleteType !== 'for_everyone') {
        throw new ApiError(400, "Invalid delete type. Must be 'for_me' or 'for_everyone'.");
      }

      const result = await chatService.deleteMessage(
        req.user,
        requestId,
        messageId,
        deleteType
      );

      // If deleted for everyone, broadcast to the request room
      if (result.type === 'for_everyone') {
        emitToRequestRoom(requestId, SOCKET_EVENTS.MESSAGE_DELETED, {
          requestId,
          messageId,
          type: 'for_everyone',
          message: result.message,
        });
      }

      sendResponse({
        res,
        statusCode: 200,
        message:
          deleteType === 'for_everyone'
            ? 'Message deleted for everyone'
            : 'Message deleted for you',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const chatController = new ChatController();
export default chatController;
