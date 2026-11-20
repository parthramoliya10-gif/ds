import { z } from 'zod';
import { Role } from '@prisma/client';

export const sendOtpSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  fullName: z.string().min(2).max(100).optional(),
});

export const verifyOtpSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  token: z
    .string()
    .min(6, 'OTP must be at least 6 digits')
    .max(10, 'Invalid OTP format'),
});

export const registerSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters long')
    .max(128),
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
});

export const loginSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  redirectTo: z.string().url().optional(),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  token: z
    .string()
    .min(6, 'OTP must be at least 6 digits')
    .max(10, 'Invalid OTP format'),
  password: z
    .string()
    .min(6, 'New password must be at least 6 characters long')
    .max(128),
});

export const establishSessionSchema = z
  .object({
    code: z.string().min(1).optional(),
    accessToken: z.string().min(1).optional(),
    refreshToken: z.string().min(1).optional(),
  })
  .refine((data) => Boolean(data.code || data.accessToken), {
    message: 'Either OAuth code or accessToken is required',
  });

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
