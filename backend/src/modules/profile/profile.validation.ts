import { z } from 'zod';

const notificationPreferencesSchema = z
  .object({
    emailNotifications: z.boolean().optional(),
    chatNotifications: z.boolean().optional(),
    paymentAlerts: z.boolean().optional(),
    documentAlerts: z.boolean().optional(),
  })
  .strict();

export const updateProfileSchema = z.object({
  // Shared fields (User & Admin)
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(100).optional(),
  phone: z.string().trim().min(7, 'Invalid phone number').max(25).nullable().optional(),
  avatarUrl: z.string().url('Avatar must be a valid URL').nullable().optional(),
  bio: z.string().trim().max(1000, 'Bio cannot exceed 1000 characters').nullable().optional(),
  country: z.string().trim().max(80).nullable().optional(),
  city: z.string().trim().max(80).nullable().optional(),
  timezone: z.string().trim().max(60).optional(),
  notificationPreferences: notificationPreferencesSchema.optional(),
  metadata: z.record(z.unknown()).optional(),

  // User-specific fields (ignored for Admins)
  organization: z.string().trim().max(150).nullable().optional(),
  address: z.string().trim().max(500).nullable().optional(),

  // Admin-specific fields (ignored for Users — enforced in service)
  department: z.string().trim().max(100).nullable().optional(),
  designation: z.string().trim().max(100).nullable().optional(),
  specializations: z.array(z.string().trim().min(1).max(60)).max(20).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).optional(),
  newPassword: z
    .string({ required_error: 'New password is required' })
    .min(8, 'New password must be at least 8 characters long')
    .max(128, 'Password cannot exceed 128 characters'),
});
