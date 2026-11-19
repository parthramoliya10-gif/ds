import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
export declare const initSocketServer: (httpServer: HttpServer) => Server;
export declare const getSocketIO: () => Server;
/**
 * Safely broadcast a real-time event to a specific request room.
 * No-ops gracefully when Socket.IO is not initialized (e.g. unit/E2E scripts).
 */
export declare const emitToRequestRoom: (requestId: string, event: string, payload: unknown) => void;
export default initSocketServer;
