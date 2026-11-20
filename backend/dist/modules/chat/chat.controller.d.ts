import { Request, Response, NextFunction } from 'express';
export declare class ChatController {
    /**
     * GET /api/v1/chat/unread-count
     * Fetch total unread message count across all conversations
     */
    getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void>;
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
    /**
     * DELETE /api/v1/chat/:requestId/messages/:messageId
     * WhatsApp style deletion: 'for_me' | 'for_everyone'
     */
    deleteMessage(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const chatController: ChatController;
export default chatController;
