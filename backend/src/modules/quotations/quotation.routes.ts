import { Router } from 'express';
import quotationController from './quotation.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireAdmin } from '../../middlewares/rbac.middleware.js';
import { validateRequest } from '../../middlewares/validate.middleware.js';
import {
  createQuotationSchema,
  rejectQuotationSchema,
} from './quotation.validation.js';

const router = Router();

// All quotation routes require authentication
router.use(authenticate);

// 1. Admin creates quotation
router.post(
  '/',
  requireAdmin,
  validateRequest({ body: createQuotationSchema }),
  quotationController.create
);

// 2. Get quotations for a specific request
router.get('/request/:requestId', quotationController.getByRequest);

// 3. User accepts quotation (generates 50% advance Razorpay order)
router.post('/:id/accept', quotationController.accept);

// 4. User rejects quotation
router.post(
  '/:id/reject',
  validateRequest({ body: rejectQuotationSchema }),
  quotationController.reject
);

export default router;
