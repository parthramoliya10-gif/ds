import { MessageType, Role } from '@prisma/client';
import { AuthenticatedUser } from '../../types/express.js';
export interface GetMessagesOptions {
    limit?: number;
    cursor?: string;
}
export interface PostMessageInput {
    content: string;
    messageType?: MessageType;
    metadata?: any;
}
export declare class ChatService {
    /**
     * Fetch conversation messages for a request with strict authorization
     */
    getConversationMessages(requestId: string, user: AuthenticatedUser, options?: GetMessagesOptions): Promise<{
        conversationId: string;
        messages: any[];
        nextCursor: string | null;
    }>;
    /**
     * Post a new message via REST (supports optional file attachments)
     */
    postMessage(user: AuthenticatedUser, requestId: string, data: PostMessageInput, file?: Express.Multer.File): Promise<any>;
    /**
     * Mark all unread messages in conversation as READ (WhatsApp blue ticks)
     * Enforces strict ownership / admin authorization
     */
    markMessagesAsRead(userId: string, requestId: string, userRole?: Role): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
export declare const chatService: ChatService;
export default chatService;
