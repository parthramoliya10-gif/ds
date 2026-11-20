import { Router } from 'express';
import requestController from './request.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireAdmin } from '../../middlewares/rbac.middleware.js';
import { validateRequest } from '../../middlewares/validate.middleware.js';
import { uploadReferenceFiles } from '../../middlewares/upload.middleware.js';
import {
  createRequestSchema,
  updateRequestStatusSchema,
} from './request.validation.js';

const router = Router();

// All request routes require authentication
router.use(authenticate);

// 1. Submit new document request with optional reference files (up to 5 files, max 10MB each)
router.post(
  '/',
  uploadReferenceFiles,
  validateRequest({ body: createRequestSchema }),
  requestController.create
);

// 2. List requests (User gets their own, Admin gets all with search/status filters)
router.get('/', requestController.list);

// 3. Get single request detail (strict IDOR ownership check)
router.get('/:id', requestController.getById);

// 4. Admin updates request status
router.patch(
  '/:id/status',
  requireAdmin,
  validateRequest({ body: updateRequestStatusSchema }),
  requestController.updateStatus
);

// 5. User cancels their own PENDING request
router.patch('/:id/cancel', requestController.cancel);

// 6. User or Admin deletes request for their own account only ("Delete for me")
router.delete('/:id', requestController.delete);

export default router;
