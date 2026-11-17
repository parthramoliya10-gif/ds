import { z } from 'zod';

export const createQuotationSchema = z.object({
  requestId: z.string().uuid('Invalid request ID format'),
  totalAmount: z
    .number({ required_error: 'Total amount is required' })
    .positive('Total amount must be greater than zero')
    .min(1, 'Minimum amount is ₹1'),
  terms: z.string().max(2000).optional(),
  estimatedDays: z
    .number()
    .int('Days must be a whole number')
    .positive('Estimated days must be positive')
    .max(365, 'Estimated days cannot exceed 365')
    .optional(),
});

export const rejectQuotationSchema = z.object({
  reason: z.string().max(500).optional(),
});
