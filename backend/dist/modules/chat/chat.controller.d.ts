import { Request, Response, NextFunction } from 'express';
export declare class ChatController {
    /**
     * GET /api/v1/chat/:requestId/messages
     * Fetch conversation history
     */
    getMessages(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/v1/chat/:requestId/messages
     * Post message via REST with optional file upload
     */
    postMessage(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * PATCH /api/v1/chat/:requestId/read
     * Mark all unread messages as READ
     */
    markRead(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const chatController: ChatController;
export default chatController;
