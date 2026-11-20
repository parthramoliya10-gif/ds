import { Server, Socket } from 'socket.io';
import { MessageStatus, MessageType, Role } from '@prisma/client';
import prisma from '../config/prisma.js';
import SOCKET_EVENTS from '../constants/socketEvents.js';
import { chatService } from '../modules/chat/chat.service.js';
import { isUserOnline, isAnyAdminOnline } from './socket.server.js';
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
        const { requestId, content, messageType, metadata } = payload || {};
        if (!requestId || !content?.trim()) {
          if (callback) callback({ success: false, error: 'requestId and non-empty content are required.' });
          return;
        }

        const roomName = `request:${requestId}`;
        if (!socket.rooms.has(roomName)) {
          const errorMsg = 'Cannot send message: You have not joined this request room.';
          if (callback) callback({ success: false, error: errorMsg });
          return;
        }

        // Determine if counterpart is online or active in room
        const request = await prisma.documentRequest.findUnique({
          where: { id: requestId },
          select: { userId: true },
        });

        let recipientOnline = false;
        if (currentUser.role === Role.ADMIN) {
          recipientOnline = request ? isUserOnline(request.userId) : false;
        } else {
          recipientOnline = isAnyAdminOnline();
        }

        const roomSockets = await io.in(roomName).fetchSockets();
        const recipientInRoom = roomSockets.some(
          (s) => s.data.user?.id !== currentUser.id
        );

        let initialStatus: MessageStatus = MessageStatus.SENT;
        if (recipientInRoom) {
          initialStatus = MessageStatus.READ;
        } else if (recipientOnline) {
          initialStatus = MessageStatus.DELIVERED;
        }

        const savedMessage = await chatService.postMessage(currentUser, requestId, {
          content: content.trim(),
          messageType,
          metadata,
          status: initialStatus,
        });

        const messagePayload = {
          ...savedMessage,
          requestId,
        };

        const targetRooms = [roomName, 'role:admin'];
        if (request?.userId) {
          targetRooms.push(`user:${request.userId}`);
        }

        io.to(targetRooms).emit(SOCKET_EVENTS.NEW_MESSAGE, messagePayload);

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
   * Enforces room membership, prevents sender from self-marking, and prevents downgrading READ -> DELIVERED
   */
  socket.on(
    SOCKET_EVENTS.MESSAGE_DELIVERED,
    async (payload: { messageId: string; requestId: string }) => {
      try {
        const { messageId, requestId } = payload || {};
        if (!messageId || !requestId) return;

        const roomName = `request:${requestId}`;
        if (!socket.rooms.has(roomName)) return;

        const deliveredAt = new Date();
        const result = await prisma.message.updateMany({
          where: {
            id: messageId,
            senderId: { not: currentUser.id },
            status: MessageStatus.SENT,
            conversation: { requestId },
          },
          data: {
            status: MessageStatus.DELIVERED,
            deliveredAt,
          },
        });

        if (result.count > 0) {
          io.to(roomName).emit(SOCKET_EVENTS.MESSAGE_STATUS_UPDATE, {
            id: messageId,
            status: MessageStatus.DELIVERED,
            deliveredAt,
          });
        }
      } catch (error) {
        logger.error('Error handling message_delivered event:', error);
      }
    }
  );

  /**
   * 3. MARK_READ: Recipient opens chat / reads messages (2 blue ticks)
   * Enforces room membership before marking messages read
   */
  socket.on(SOCKET_EVENTS.MARK_READ, async (payload: { requestId: string }) => {
    try {
      const { requestId } = payload || {};
      if (!requestId) return;

      const roomName = `request:${requestId}`;
      const result = await chatService.markMessagesAsRead(currentUser.id, requestId, currentUser.role);

      if (result.count > 0) {
        const readPayload = {
          requestId,
          readerId: currentUser.id,
          readerRole: currentUser.role,
          readAt: new Date(),
        };

        const targetRooms = [roomName, 'role:admin'];
        const reqDoc = await prisma.documentRequest.findUnique({
          where: { id: requestId },
          select: { userId: true },
        });
        if (reqDoc?.userId) {
          targetRooms.push(`user:${reqDoc.userId}`);
        }

        io.to(targetRooms).emit(SOCKET_EVENTS.MESSAGES_READ, readPayload);
      }
    } catch (error) {
      logger.error('Error handling mark_read event:', error);
    }
  });

  /**
   * 4. TYPING_START: "Admin is typing..." or "User is typing..."
   */
  socket.on(SOCKET_EVENTS.TYPING_START, (payload: { requestId: string }) => {
    if (!payload?.requestId) return;
    const roomName = `request:${payload.requestId}`;
    if (!socket.rooms.has(roomName)) return;

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
    if (!payload?.requestId) return;
    const roomName = `request:${payload.requestId}`;
    if (!socket.rooms.has(roomName)) return;

    socket.to(roomName).emit(SOCKET_EVENTS.USER_TYPING, {
      requestId: payload.requestId,
      userId: currentUser.id,
      isTyping: false,
    });
  });
};

export default registerChatHandlers;
