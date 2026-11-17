import { Server, Socket } from 'socket.io';
import { MessageStatus, MessageType, Role } from '@prisma/client';
import prisma from '../config/prisma.js';
import SOCKET_EVENTS from '../constants/socketEvents.js';
import { chatService } from '../modules/chat/chat.service.js';
import logger from '../utils/logger.js';

export const registerChatHandlers = (io: Server, socket: Socket) => {
  const currentUser = socket.data.user;

  /**
   * 1. SEND_MESSAGE: User or Admin sends a real-time message
   */
  socket.on(
    SOCKET_EVENTS.SEND_MESSAGE,
    async (
      payload: {
        requestId: string;
        content: string;
        messageType?: MessageType;
        metadata?: any;
      },
      callback?: (response: any) => void
    ) => {
      try {
        const { requestId, content, messageType, metadata } = payload;
        const roomName = `request:${requestId}`;

        if (!socket.rooms.has(roomName)) {
          const errorMsg = 'Cannot send message: You have not joined this request room.';
          if (callback) callback({ success: false, error: errorMsg });
          return;
        }

        // Save message to database
        const savedMessage = await chatService.postMessage(currentUser, requestId, {
          content,
          messageType,
          metadata,
        });

        // Broadcast to all clients in the request room (including Admin & User)
        io.to(roomName).emit(SOCKET_EVENTS.NEW_MESSAGE, savedMessage);

        // Acknowledge sender
        if (callback) {
          callback({ success: true, message: savedMessage });
        }
      } catch (error: any) {
        logger.error('Error handling send_message event:', error);
        if (callback) {
          callback({ success: false, error: error.message || 'Failed to send message.' });
        }
      }
    }
  );

  /**
   * 2. MESSAGE_DELIVERED: Recipient acknowledges delivery (2 ticks)
   */
  socket.on(
    SOCKET_EVENTS.MESSAGE_DELIVERED,
    async (payload: { messageId: string; requestId: string }) => {
      try {
        const { messageId, requestId } = payload;
        const roomName = `request:${requestId}`;

        const updated = await prisma.message.update({
          where: { id: messageId },
          data: {
            status: MessageStatus.DELIVERED,
            deliveredAt: new Date(),
          },
          select: { id: true, status: true, deliveredAt: true },
        });

        io.to(roomName).emit(SOCKET_EVENTS.MESSAGE_STATUS_UPDATE, updated);
      } catch (error) {
        logger.error('Error handling message_delivered event:', error);
      }
    }
  );

  /**
   * 3. MARK_READ: Recipient opens chat / reads messages (2 blue ticks)
   */
  socket.on(SOCKET_EVENTS.MARK_READ, async (payload: { requestId: string }) => {
    try {
      const { requestId } = payload;
      const roomName = `request:${requestId}`;

      await chatService.markMessagesAsRead(currentUser.id, requestId);

      // Broadcast blue ticks update to the room
      io.to(roomName).emit(SOCKET_EVENTS.MESSAGES_READ, {
        requestId,
        readerId: currentUser.id,
        readAt: new Date(),
      });
    } catch (error) {
      logger.error('Error handling mark_read event:', error);
    }
  });

  /**
   * 4. TYPING_START: "Admin is typing..." or "User is typing..."
   */
  socket.on(SOCKET_EVENTS.TYPING_START, (payload: { requestId: string }) => {
    const roomName = `request:${payload.requestId}`;
    socket.to(roomName).emit(SOCKET_EVENTS.USER_TYPING, {
      requestId: payload.requestId,
      userId: currentUser.id,
      fullName: currentUser.fullName || (currentUser.role === Role.ADMIN ? 'Admin' : 'User'),
      role: currentUser.role,
      isTyping: true,
    });
  });

  /**
   * 5. TYPING_STOP: Stop typing indicator
   */
  socket.on(SOCKET_EVENTS.TYPING_STOP, (payload: { requestId: string }) => {
    const roomName = `request:${payload.requestId}`;
    socket.to(roomName).emit(SOCKET_EVENTS.USER_TYPING, {
      requestId: payload.requestId,
      userId: currentUser.id,
      isTyping: false,
    });
  });
};

export default registerChatHandlers;
