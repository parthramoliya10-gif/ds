import { Router } from 'express';
import chatController from './chat.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { uploadSingleFinalDocument } from '../../middlewares/upload.middleware.js';

const router = Router();

// All chat routes require authentication
router.use(authenticate);

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

export default router;
