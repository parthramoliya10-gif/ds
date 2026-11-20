import { Router } from 'express';
import chatController from './chat.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { uploadSingleFinalDocument } from '../../middlewares/upload.middleware.js';

const router = Router();

// All chat routes require authentication
router.use(authenticate);

// 0. Fetch total unread message count across all conversations
router.get('/unread-count', chatController.getUnreadCount);

// 1. Fetch message history
router.get('/:requestId/messages', chatController.getMessages);

// 2. Post message with optional file upload via REST
router.post(
  '/:requestId/messages',
  uploadSingleFinalDocument, // Multer single file upload helper
  chatController.postMessage
);

// 3. Mark messages as read (Blue ticks)
router.patch('/:requestId/read', chatController.markRead);

// 4. Delete message (WhatsApp style: 'for_me' or 'for_everyone')
router.delete('/:requestId/messages/:messageId', chatController.deleteMessage);

export default router;
