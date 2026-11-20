import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import prisma from '../config/prisma.js';
import { supabaseAdmin } from '../config/supabase.js';
import SOCKET_EVENTS from '../constants/socketEvents.js';
import { registerChatHandlers } from './chat.handler.js';
import { Role, MessageStatus } from '@prisma/client';
import logger from '../utils/logger.js';

let io: Server | null = null;

// Track online users: Map<userId, Set<socketId>>
export const onlineUsers = new Map<string, Set<string>>();
export const onlineUserRoles = new Map<string, Role>();

export const isUserOnline = (userId: string): boolean => {
  return (onlineUsers.get(userId)?.size || 0) > 0;
};

export const isAnyAdminOnline = (): boolean => {
  for (const [userId, sockets] of onlineUsers.entries()) {
    if (sockets.size > 0 && onlineUserRoles.get(userId) === Role.ADMIN) {
      return true;
    }
  }
  return false;
};

export const initSocketServer = (httpServer: HttpServer): Server => {
  const allowedOrigins = [
    env.CLIENT_URL,
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
  ];

  if (env.CLIENT_URL.startsWith('https://') && !env.CLIENT_URL.startsWith('https://www.')) {
    allowedOrigins.push(env.CLIENT_URL.replace('https://', 'https://www.'));
  }

  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['polling', 'websocket'],
    pingTimeout: 30000,
    pingInterval: 25000,
  });

  // ==========================================
  // Socket.IO Handshake Authentication Middleware
  // ==========================================
  io.use(async (socket: Socket, next) => {
    try {
      let token: string | undefined = socket.handshake.auth?.token;

      // Also check headers / cookies fallback
      if (!token && socket.handshake.headers.authorization) {
        const header = socket.handshake.headers.authorization;
        if (header.startsWith('Bearer ')) {
          token = header.split(' ')[1];
        }
      }

      if (!token && socket.handshake.headers.cookie) {
        const cookies = socket.handshake.headers.cookie.split(';').reduce((acc, c) => {
          const [k, v] = c.trim().split('=');
          acc[k] = v;
          return acc;
        }, {} as Record<string, string>);
        token = cookies['access_token'] || cookies['sb-access-token'];
      }

      if (!token) {
        return next(new Error('Authentication token missing.'));
      }

      let userId: string | undefined;

      // 1. Verify token with SUPABASE_JWT_SECRET
      try {
        const decoded = jwt.verify(token, env.SUPABASE_JWT_SECRET) as any;
        userId = decoded.sub;
      } catch (jwtErr) {
        // Fallback to Supabase getUser API
        const { data: authUser, error } = await supabaseAdmin.auth.getUser(token);
        if (error || !authUser?.user) {
          return next(new Error('Invalid or expired authentication token.'));
        }
        userId = authUser.user.id;
      }

      if (!userId) {
        return next(new Error('Invalid token payload.'));
      }

      // 2. Check separate Admins table first, then Users table
      const admin = await prisma.admin.findUnique({
        where: { id: userId },
      });

      if (admin) {
        if (!admin.isActive) {
          return next(new Error('Admin account deactivated. Access denied.'));
        }
        socket.data.user = {
          id: admin.id,
          email: admin.email,
          fullName: admin.fullName,
          avatarUrl: admin.avatarUrl,
          role: Role.ADMIN,
          isBlocked: !admin.isActive,
        };
        return next();
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return next(new Error('User profile not found.'));
      }

      if (user.isBlocked) {
        return next(new Error('Account suspended. Access denied.'));
      }

      // Attach authenticated user to socket session
      socket.data.user = {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        role: Role.USER,
        isBlocked: user.isBlocked,
      };
      next();
    } catch (err: any) {
      logger.error('Socket authentication handshake error:', err);
      next(new Error('Socket authentication failed.'));
    }
  });

  // ==========================================
  // Socket Connection & Room Management
  // ==========================================
  io.on(SOCKET_EVENTS.CONNECT, (socket: Socket) => {
    const user = socket.data.user;
    logger.info(`🔌 Socket connected: ${socket.id} (User: ${user.email}, Role: ${user.role})`);

    // 1. Presence tracking: Add socketId to user's active set
    if (!onlineUsers.has(user.id)) {
      onlineUsers.set(user.id, new Set());
      onlineUserRoles.set(user.id, user.role);
      // Broadcast online status to all
      io?.emit(SOCKET_EVENTS.USER_STATUS_CHANGE, {
        userId: user.id,
        role: user.role,
        status: 'ONLINE',
      });
    }
    onlineUsers.get(user.id)!.add(socket.id);

    // Auto-deliver any pending messages waiting for this user
    if (user.role === Role.USER) {
      prisma.message.updateMany({
        where: {
          status: MessageStatus.SENT,
          senderRole: Role.ADMIN,
          conversation: { request: { userId: user.id } },
        },
        data: {
          status: MessageStatus.DELIVERED,
          deliveredAt: new Date(),
        },
      }).catch(() => {});
    } else if (user.role === Role.ADMIN) {
      prisma.message.updateMany({
        where: {
          status: MessageStatus.SENT,
          senderRole: Role.USER,
        },
        data: {
          status: MessageStatus.DELIVERED,
          deliveredAt: new Date(),
        },
      }).catch(() => {});
    }

    // 2. Room Joining with Strict Authorization
    socket.on(
      SOCKET_EVENTS.JOIN_REQUEST_ROOM,
      async (payload: { requestId: string }, callback?: (res: any) => void) => {
        try {
          const { requestId } = payload;
          if (!requestId) return;

          // Verify user is permitted to enter this request room
          const request = await prisma.documentRequest.findUnique({
            where: { id: requestId },
            select: { id: true, userId: true },
          });

          if (!request) {
            socket.emit(SOCKET_EVENTS.ROOM_ERROR, { error: 'Request not found.' });
            if (callback) callback({ success: false, error: 'Request not found.' });
            return;
          }

          if (user.role !== Role.ADMIN && request.userId !== user.id) {
            socket.emit(SOCKET_EVENTS.ROOM_ERROR, {
              error: 'Forbidden: You cannot join this request room.',
            });
            if (callback) callback({ success: false, error: 'Forbidden.' });
            return;
          }

          const roomName = `request:${requestId}`;
          socket.join(roomName);
          logger.info(`👥 User ${user.email} joined room: ${roomName}`);

          let counterpartOnline = false;
          if (user.role === Role.ADMIN) {
            counterpartOnline = isUserOnline(request.userId);
          } else {
            counterpartOnline = isAnyAdminOnline();
          }

          socket.emit(SOCKET_EVENTS.ROOM_JOINED, { requestId, counterpartOnline });

          socket.to(roomName).emit('room_peer_status', {
            requestId,
            userId: user.id,
            role: user.role,
            status: 'ONLINE',
          });

          if (callback) callback({ success: true, room: roomName, counterpartOnline });
        } catch (error: any) {
          logger.error('Error joining request room:', error);
          if (callback) callback({ success: false, error: error.message });
        }
      }
    );

    // 3. Room Leaving
    socket.on(SOCKET_EVENTS.LEAVE_REQUEST_ROOM, (payload: { requestId: string }) => {
      const roomName = `request:${payload.requestId}`;
      socket.leave(roomName);
      logger.info(`🚪 User ${user.email} left room: ${roomName}`);

      socket.to(roomName).emit('room_peer_status', {
        requestId: payload.requestId,
        userId: user.id,
        role: user.role,
        status: 'OFFLINE',
      });
    });

    // 4. Register WhatsApp Chat Handlers (Messaging, Ticks, Typing)
    registerChatHandlers(io!, socket);

    // 5. Disconnect Lifecycle
    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      logger.info(`🔌 Socket disconnected: ${socket.id} (User: ${user.email})`);

      const userSockets = onlineUsers.get(user.id);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(user.id);
          onlineUserRoles.delete(user.id);
          // Broadcast offline status
          io?.emit(SOCKET_EVENTS.USER_STATUS_CHANGE, {
            userId: user.id,
            role: user.role,
            status: 'OFFLINE',
          });
        }
      }
    });
  });

  return io;
};

export const getSocketIO = (): Server => {
  if (!io) {
    throw new Error('Socket.IO has not been initialized. Call initSocketServer first.');
  }
  return io;
};

/**
 * Safely broadcast a real-time event to a specific request room.
 * No-ops gracefully when Socket.IO is not initialized (e.g. unit/E2E scripts).
 */
export const emitToRequestRoom = (requestId: string, event: string, payload: unknown): void => {
  if (!io) return;
  io.to(`request:${requestId}`).emit(event, payload);
};

export default initSocketServer;
