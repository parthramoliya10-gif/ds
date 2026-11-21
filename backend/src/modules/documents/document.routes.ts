import { Router } from 'express';
import documentController from './document.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireAdmin } from '../../middlewares/rbac.middleware.js';
import { uploadSingleFinalDocument } from '../../middlewares/upload.middleware.js';
import { validateRequest } from '../../middlewares/validate.middleware.js';
import { uploadFinalDocumentSchema } from './document.validation.js';

const router = Router();

// All document routes require authentication
router.use(authenticate);

// 1. Admin uploads completed final document
router.post(
  '/:requestId/upload',
  requireAdmin,
  uploadSingleFinalDocument,
  validateRequest({ body: uploadFinalDocumentSchema }),
  documentController.upload
);

// 2. Get document records for request (with download lock status)
router.get('/request/:requestId', documentController.getByRequest);

// 3. SECURE GATEKEEPER: Download completed document (unlocked ONLY after 100% payment)
router.get('/:documentId/download', documentController.download);

// 4. Admin deletes final document version
router.delete('/:documentId', requireAdmin, documentController.delete);

export default router;
