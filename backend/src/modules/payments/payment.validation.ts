import { z } from 'zod';
import { PaymentMilestone } from '@prisma/client';

export const createOrderSchema = z.object({
  requestId: z.string().uuid('Invalid request ID format'),
  milestone: z.nativeEnum(PaymentMilestone, {
    errorMap: () => ({ message: 'Milestone must be either ADVANCE_50 or FINAL_50' }),
  }),
});

export const verifyPaymentSchema = z.object({
  razorpayOrderId: z.string().min(1, 'razorpayOrderId is required'),
  razorpayPaymentId: z.string().min(1, 'razorpayPaymentId is required'),
  razorpaySignature: z.string().min(1, 'razorpaySignature is required'),
});
