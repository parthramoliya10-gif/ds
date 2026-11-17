import { z } from 'zod';

export const uploadFinalDocumentSchema = z.object({
  title: z
    .string({ required_error: 'Document title is required' })
    .min(3, 'Title must be at least 3 characters long')
    .max(150, 'Title cannot exceed 150 characters')
    .trim(),
});
