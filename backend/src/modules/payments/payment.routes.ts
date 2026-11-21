import { Router } from 'express';
import paymentController from './payment.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireAdmin } from '../../middlewares/rbac.middleware.js';
import { validateRequest } from '../../middlewares/validate.middleware.js';
import {
  createOrderSchema,
  verifyPaymentSchema,
} from './payment.validation.js';

const router = Router();

// 1. Webhook endpoint (Public, verified via x-razorpay-signature header)
router.post('/webhook', paymentController.webhook);

// Protected routes below
router.use(authenticate);

// 2. Create Razorpay order for ADVANCE_50 or FINAL_50
router.post(
  '/create-order',
  validateRequest({ body: createOrderSchema }),
  paymentController.createOrder
);

// 3. Verify payment signature after checkout
router.post(
  '/verify',
  validateRequest({ body: verifyPaymentSchema }),
  paymentController.verify
);

// 4. Record or complete milestone payment (for verified checkout & sandbox simulation)
router.post('/complete', paymentController.completePayment);

// 5. User's own payment history
router.get('/my-history', paymentController.myHistory);

// 6. Admin global payments list
router.get('/admin/all', requireAdmin, paymentController.adminList);

export default router;
