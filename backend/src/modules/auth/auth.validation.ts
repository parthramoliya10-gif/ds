import { z } from 'zod';
import { Role } from '@prisma/client';

export const updateProfileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100).optional(),
  phone: z.string().min(7, 'Invalid phone number').max(20).optional(),
  avatarUrl: z.string().url('Avatar must be a valid URL').optional(),
});

export const updateRoleSchema = z.object({
  role: z.nativeEnum(Role, {
    errorMap: () => ({ message: 'Role must be either ADMIN or USER' }),
  }),
});

export const updateStatusSchema = z.object({
  isBlocked: z.boolean({
    required_error: 'isBlocked status is required',
  }),
});
