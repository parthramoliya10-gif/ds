"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitToRequestRoom = exports.getSocketIO = exports.initSocketServer = exports.isAnyAdminOnline = exports.isUserOnline = exports.onlineUserRoles = exports.onlineUsers = void 0;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_js_1 = __importDefault(require("../config/env.js"));
const prisma_js_1 = __importDefault(require("../config/prisma.js"));
const supabase_js_1 = require("../config/supabase.js");
const socketEvents_js_1 = __importDefault(require("../constants/socketEvents.js"));
const chat_handler_js_1 = require("./chat.handler.js");
const chat_service_js_1 = require("../modules/chat/chat.service.js");
const client_1 = require("@prisma/client");
const logger_js_1 = __importDefault(require("../utils/logger.js"));
let io = null;
// Track online users: Map<userId, Set<socketId>>
exports.onlineUsers = new Map();
exports.onlineUserRoles = new Map();
const isUserOnline = (userId) => {
    return (exports.onlineUsers.get(userId)?.size || 0) > 0;
};
exports.isUserOnline = isUserOnline;
const isAnyAdminOnline = () => {
    for (const [userId, sockets] of exports.onlineUsers.entries()) {
        if (sockets.size > 0 && exports.onlineUserRoles.get(userId) === client_1.Role.ADMIN) {
            return true;
        }
    }
    return false;
};
exports.isAnyAdminOnline = isAnyAdminOnline;
const initSocketServer = (httpServer) => {
    const allowedOrigins = [
        env_js_1.default.CLIENT_URL,
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
    ];
    if (env_js_1.default.CLIENT_URL.startsWith('https://') && !env_js_1.default.CLIENT_URL.startsWith('https://www.')) {
        allowedOrigins.push(env_js_1.default.CLIENT_URL.replace('https://', 'https://www.'));
    }
    io = new socket_io_1.Server(httpServer, {
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
    io.use(async (socket, next) => {
        try {
            let token = socket.handshake.auth?.token;
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
                }, {});
                token = cookies['access_token'] || cookies['sb-access-token'];
            }
            if (!token) {
                return next(new Error('Authentication token missing.'));
            }
            let userId;
            // 1. Verify token with SUPABASE_JWT_SECRET
            try {
                const decoded = jsonwebtoken_1.default.verify(token, env_js_1.default.SUPABASE_JWT_SECRET);
                userId = decoded.sub;
            }
            catch (jwtErr) {
                // Fallback to Supabase getUser API
                const { data: authUser, error } = await supabase_js_1.supabaseAdmin.auth.getUser(token);
                if (error || !authUser?.user) {
                    return next(new Error('Invalid or expired authentication token.'));
                }
                userId = authUser.user.id;
            }
            if (!userId) {
                return next(new Error('Invalid token payload.'));
            }
            // 2. Check separate Admins table first, then Users table
            const admin = await prisma_js_1.default.admin.findUnique({
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
                    role: client_1.Role.ADMIN,
                    isBlocked: !admin.isActive,
                };
                return next();
            }
            let user = await prisma_js_1.default.user.findUnique({
                where: { id: userId },
            });
            if (!user) {
                const { data: authUser } = await supabase_js_1.supabaseAdmin.auth.admin.getUserById(userId);
                if (authUser?.user) {
                    const userMeta = authUser.user.user_metadata || {};
                    user = await prisma_js_1.default.user.create({
                        data: {
                            id: userId,
                            email: authUser.user.email || '',
                            fullName: userMeta.fullName || userMeta.name || authUser.user.email?.split('@')[0] || 'User',
                            avatarUrl: userMeta.avatarUrl || userMeta.avatar_url || null,
                            phone: userMeta.phone || null,
                        },
                    });
                }
                else {
                    return next(new Error('User profile not found.'));
                }
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
                role: client_1.Role.USER,
                isBlocked: user.isBlocked,
            };
            next();
        }
        catch (err) {
            logger_js_1.default.error('Socket authentication handshake error:', err);
            next(new Error('Socket authentication failed.'));
        }
    });
    // ==========================================
    // Socket Connection & Room Management
    // ==========================================
    io.on(socketEvents_js_1.default.CONNECT, (socket) => {
        const user = socket.data.user;
        logger_js_1.default.info(`🔌 Socket connected: ${socket.id} (User: ${user.email}, Role: ${user.role})`);
        // Join personal user room and/or role:admin room for live notifications and badge counts
        socket.join(`user:${user.id}`);
        if (user.role === client_1.Role.ADMIN) {
            socket.join('role:admin');
        }
        // 1. Presence tracking: Add socketId to user's active set
        if (!exports.onlineUsers.has(user.id)) {
            exports.onlineUsers.set(user.id, new Set());
            exports.onlineUserRoles.set(user.id, user.role);
            // Broadcast online status to all
            io?.emit(socketEvents_js_1.default.USER_STATUS_CHANGE, {
                userId: user.id,
                role: user.role,
                status: 'ONLINE',
                anyAdminOnline: (0, exports.isAnyAdminOnline)(),
            });
        }
        exports.onlineUsers.get(user.id).add(socket.id);
        // Auto-deliver any pending messages waiting for this user
        if (user.role === client_1.Role.USER) {
            prisma_js_1.default.message.updateMany({
                where: {
                    status: client_1.MessageStatus.SENT,
                    senderRole: client_1.Role.ADMIN,
                    conversation: { request: { userId: user.id } },
                },
                data: {
                    status: client_1.MessageStatus.DELIVERED,
                    deliveredAt: new Date(),
                },
            }).catch(() => { });
        }
        else if (user.role === client_1.Role.ADMIN) {
            prisma_js_1.default.message.updateMany({
                where: {
                    status: client_1.MessageStatus.SENT,
                    senderRole: client_1.Role.USER,
                },
                data: {
                    status: client_1.MessageStatus.DELIVERED,
                    deliveredAt: new Date(),
                },
            }).catch(() => { });
        }
        // 2. Room Joining with Strict Authorization
        socket.on(socketEvents_js_1.default.JOIN_REQUEST_ROOM, async (payload, callback) => {
            try {
                const { requestId } = payload;
                if (!requestId)
                    return;
                // Verify user is permitted to enter this request room
                const request = await prisma_js_1.default.documentRequest.findUnique({
                    where: { id: requestId },
                    select: { id: true, userId: true },
                });
                if (!request) {
                    socket.emit(socketEvents_js_1.default.ROOM_ERROR, { error: 'Request not found.' });
                    if (callback)
                        callback({ success: false, error: 'Request not found.' });
                    return;
                }
                if (user.role !== client_1.Role.ADMIN && request.userId !== user.id) {
                    socket.emit(socketEvents_js_1.default.ROOM_ERROR, {
                        error: 'Forbidden: You cannot join this request room.',
                    });
                    if (callback)
                        callback({ success: false, error: 'Forbidden.' });
                    return;
                }
                const roomName = `request:${requestId}`;
                socket.join(roomName);
                logger_js_1.default.info(`👥 User ${user.email} joined room: ${roomName}`);
                // Automatically mark counterpart messages as READ when joining the room
                chat_service_js_1.chatService
                    .markMessagesAsRead(user.id, requestId, user.role)
                    .then((markRes) => {
                    if (markRes.count > 0 && io) {
                        const readPayload = {
                            requestId,
                            readerId: user.id,
                            readerRole: user.role,
                            readAt: new Date(),
                        };
                        const rooms = [roomName, 'role:admin'];
                        if (request.userId) {
                            rooms.push(`user:${request.userId}`);
                        }
                        io.to(rooms).emit(socketEvents_js_1.default.MESSAGES_READ, readPayload);
                    }
                })
                    .catch(() => { });
                let counterpartOnline = false;
                if (user.role === client_1.Role.ADMIN) {
                    counterpartOnline = (0, exports.isUserOnline)(request.userId);
                }
                else {
                    counterpartOnline = (0, exports.isAnyAdminOnline)();
                }
                socket.emit(socketEvents_js_1.default.ROOM_JOINED, { requestId, counterpartOnline });
                socket.to(roomName).emit('room_peer_status', {
                    requestId,
                    userId: user.id,
                    role: user.role,
                    status: 'ONLINE',
                });
                if (callback)
                    callback({ success: true, room: roomName, counterpartOnline });
            }
            catch (error) {
                logger_js_1.default.error('Error joining request room:', error);
                if (callback)
                    callback({ success: false, error: error.message });
            }
        });
        // 3. Room Leaving
        socket.on(socketEvents_js_1.default.LEAVE_REQUEST_ROOM, (payload) => {
            const roomName = `request:${payload.requestId}`;
            socket.leave(roomName);
            logger_js_1.default.info(`🚪 User ${user.email} left room: ${roomName}`);
            // Only notify OFFLINE if this user has no remaining active sockets on DSMS
            const stillOnline = user.role === client_1.Role.ADMIN ? (0, exports.isAnyAdminOnline)() : (0, exports.isUserOnline)(user.id);
            if (!stillOnline) {
                socket.to(roomName).emit('room_peer_status', {
                    requestId: payload.requestId,
                    userId: user.id,
                    role: user.role,
                    status: 'OFFLINE',
                });
            }
        });
        // 4. Register WhatsApp Chat Handlers (Messaging, Ticks, Typing)
        (0, chat_handler_js_1.registerChatHandlers)(io, socket);
        // 5. Disconnect Lifecycle
        socket.on(socketEvents_js_1.default.DISCONNECT, () => {
            logger_js_1.default.info(`🔌 Socket disconnected: ${socket.id} (User: ${user.email})`);
            const userSockets = exports.onlineUsers.get(user.id);
            if (userSockets) {
                userSockets.delete(socket.id);
                if (userSockets.size === 0) {
                    exports.onlineUsers.delete(user.id);
                    exports.onlineUserRoles.delete(user.id);
                    // Broadcast offline status
                    io?.emit(socketEvents_js_1.default.USER_STATUS_CHANGE, {
                        userId: user.id,
                        role: user.role,
                        status: 'OFFLINE',
                        anyAdminOnline: (0, exports.isAnyAdminOnline)(),
                    });
                }
            }
        });
    });
    return io;
};
exports.initSocketServer = initSocketServer;
const getSocketIO = () => {
    if (!io) {
        throw new Error('Socket.IO has not been initialized. Call initSocketServer first.');
    }
    return io;
};
exports.getSocketIO = getSocketIO;
/**
 * Safely broadcast a real-time event to a specific request room,
 * plus the counterpart's personal notification rooms so sidebar badges update live.
 * No-ops gracefully when Socket.IO is not initialized (e.g. unit/E2E scripts).
 */
const emitToRequestRoom = (requestId, event, payload) => {
    if (!io)
        return;
    const eventPayload = typeof payload === 'object' && payload !== null && !('requestId' in payload)
        ? { ...payload, requestId }
        : payload;
    prisma_js_1.default.documentRequest
        .findUnique({
        where: { id: requestId },
        select: { userId: true },
    })
        .then((request) => {
        if (!io)
            return;
        const rooms = [`request:${requestId}`, 'role:admin'];
        if (request?.userId) {
            rooms.push(`user:${request.userId}`);
        }
        io.to(rooms).emit(event, eventPayload);
    })
        .catch(() => {
        io?.to(`request:${requestId}`).emit(event, eventPayload);
    });
};
exports.emitToRequestRoom = emitToRequestRoom;
exports.default = exports.initSocketServer;
//# sourceMappingURL=socket.server.js.map