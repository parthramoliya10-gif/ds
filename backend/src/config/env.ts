import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_PREFIX: z.string().default('/api/v1'),
  CLIENT_URL: z.string().default('http://localhost:3000'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z
    .string()
    .optional()
    .default('')
    .transform((val) => val || process.env.DATABASE_URL || ''),

  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  SUPABASE_JWT_SECRET: z.string().min(1, 'SUPABASE_JWT_SECRET is required'),

  UPSTASH_REDIS_REST_URL: z.string().optional().default(''),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional().default(''),
  REDIS_URL: z.string().optional().default(''),

  CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
  CLOUDINARY_API_KEY: z.string().optional().default(''),
  CLOUDINARY_API_SECRET: z.string().optional().default(''),

  RAZORPAY_KEY_ID: z.string().optional().default(''),
  RAZORPAY_KEY_SECRET: z.string().optional().default(''),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional().default(''),

  RESEND_API_KEY: z.string().optional().default(''),
  RESEND_FROM_EMAIL: z.string().optional().default(''),
});

const parseEnv = () => {
  // Sanitize process.env keys and strip trailing spaces or wrapping quotes
  for (const [key, val] of Object.entries(process.env)) {
    const cleanKey = key.trim();
    let cleanVal = typeof val === 'string' ? val.trim() : val;
    if (typeof cleanVal === 'string') {
      if (
        (cleanVal.startsWith('"') && cleanVal.endsWith('"')) ||
        (cleanVal.startsWith("'") && cleanVal.endsWith("'"))
      ) {
        cleanVal = cleanVal.slice(1, -1).trim();
      }
    }
    if (cleanKey !== key) {
      delete process.env[key];
    }
    process.env[cleanKey] = cleanVal;
  }

  // Common naming aliases fallbacks
  if (!process.env.DIRECT_URL && process.env.DATABASE_URL) {
    process.env.DIRECT_URL = process.env.DATABASE_URL;
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    process.env.SUPABASE_SERVICE_ROLE_KEY =
      process.env.SUPABASE_SERVICE_KEY ||
      process.env.SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SECRET_KEY ||
      '';
  }
  if (!process.env.SUPABASE_JWT_SECRET) {
    process.env.SUPABASE_JWT_SECRET =
      process.env.JWT_SECRET ||
      process.env.SUPABASE_SECRET ||
      '';
  }

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const errorDetails = JSON.stringify(parsed.error.format(), null, 2);
    console.error('❌ Environment validation failed:\n', errorDetails);
    throw new Error(`Environment validation failed. Missing or invalid variables:\n${errorDetails}`);
  }
  return parsed.data;
};

export const env = parseEnv();
export default env;
