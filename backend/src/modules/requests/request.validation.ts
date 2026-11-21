import { z } from 'zod';
import { RequestStatus } from '@prisma/client';

export const createRequestSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .min(3, 'Title must be at least 3 characters long')
    .max(150, 'Title cannot exceed 150 characters')
    .trim(),
  description: z
    .string({ required_error: 'Description is required' })
    .min(10, 'Description must be at least 10 characters long')
    .max(3000, 'Description cannot exceed 3000 characters')
    .trim(),
  category: z.string().max(50).optional().default('General Document'),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
});

export const updateRequestStatusSchema = z.object({
  status: z
    .nativeEnum(RequestStatus, {
      errorMap: () => ({
        message:
          'Invalid status. Allowed values: PENDING, QUOTED, IN_PROGRESS, DOCUMENT_UPLOADED, COMPLETED, CANCELLED',
      }),
    })
    .optional(),
  isDownloadUnlocked: z.boolean().optional(),
});
