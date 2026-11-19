"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    PORT: zod_1.z.string().default('5000').transform((val) => parseInt(val, 10)),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    API_PREFIX: zod_1.z.string().default('/api/v1'),
    CLIENT_URL: zod_1.z.string().default('http://localhost:3000'),
    DATABASE_URL: zod_1.z.string().min(1, 'DATABASE_URL is required'),
    DIRECT_URL: zod_1.z
        .string()
        .optional()
        .default('')
        .transform((val) => val || process.env.DATABASE_URL || ''),
    SUPABASE_URL: zod_1.z.string().url('SUPABASE_URL must be a valid URL'),
    SUPABASE_ANON_KEY: zod_1.z.string().min(1, 'SUPABASE_ANON_KEY is required'),
    SUPABASE_SERVICE_ROLE_KEY: zod_1.z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
    SUPABASE_JWT_SECRET: zod_1.z.string().min(1, 'SUPABASE_JWT_SECRET is required'),
    UPSTASH_REDIS_REST_URL: zod_1.z.string().optional().default(''),
    UPSTASH_REDIS_REST_TOKEN: zod_1.z.string().optional().default(''),
    CLOUDINARY_CLOUD_NAME: zod_1.z.string().optional().default(''),
    CLOUDINARY_API_KEY: zod_1.z.string().optional().default(''),
    CLOUDINARY_API_SECRET: zod_1.z.string().optional().default(''),
    RAZORPAY_KEY_ID: zod_1.z.string().optional().default(''),
    RAZORPAY_KEY_SECRET: zod_1.z.string().optional().default(''),
    RAZORPAY_WEBHOOK_SECRET: zod_1.z.string().optional().default(''),
    RESEND_API_KEY: zod_1.z.string().optional().default(''),
    RESEND_FROM_EMAIL: zod_1.z.string().optional().default(''),
});
const parseEnv = () => {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
        const errorDetails = JSON.stringify(parsed.error.format(), null, 2);
        console.error('❌ Environment validation failed:\n', errorDetails);
        throw new Error(`Environment validation failed. Missing or invalid variables:\n${errorDetails}`);
    }
    return parsed.data;
};
exports.env = parseEnv();
exports.default = exports.env;
//# sourceMappingURL=env.js.map