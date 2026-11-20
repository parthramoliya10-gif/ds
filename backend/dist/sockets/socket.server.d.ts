import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
export declare const onlineUsers: Map<string, Set<string>>;
export declare const onlineUserRoles: Map<string, import(".prisma/client").$Enums.Role>;
export declare const isUserOnline: (userId: string) => boolean;
export declare const isAnyAdminOnline: () => boolean;
export declare const initSocketServer: (httpServer: HttpServer) => Server;
export declare const getSocketIO: () => Server;
/**
 * Safely broadcast a real-time event to a specific request room.
 * No-ops gracefully when Socket.IO is not initialized (e.g. unit/E2E scripts).
 */
export declare const emitToRequestRoom: (requestId: string, event: string, payload: unknown) => void;
export default initSocketServer;
