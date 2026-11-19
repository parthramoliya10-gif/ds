import { z } from 'zod';
export declare const sendOtpSchema: z.ZodObject<{
    email: z.ZodString;
    fullName: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    fullName?: string | undefined;
}, {
    email: string;
    fullName?: string | undefined;
}>;
export declare const verifyOtpSchema: z.ZodObject<{
    email: z.ZodString;
    token: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    token: string;
}, {
    email: string;
    token: string;
}>;
export declare const registerSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    fullName: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    fullName: string;
    password: string;
}, {
    email: string;
    fullName: string;
    password: string;
}>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const forgotPasswordSchema: z.ZodObject<{
    email: z.ZodString;
    redirectTo: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    redirectTo?: string | undefined;
}, {
    email: string;
    redirectTo?: string | undefined;
}>;
export declare const establishSessionSchema: z.ZodEffects<z.ZodObject<{
    code: z.ZodOptional<z.ZodString>;
    accessToken: z.ZodOptional<z.ZodString>;
    refreshToken: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    code?: string | undefined;
    accessToken?: string | undefined;
    refreshToken?: string | undefined;
}, {
    code?: string | undefined;
    accessToken?: string | undefined;
    refreshToken?: string | undefined;
}>, {
    code?: string | undefined;
    accessToken?: string | undefined;
    refreshToken?: string | undefined;
}, {
    code?: string | undefined;
    accessToken?: string | undefined;
    refreshToken?: string | undefined;
}>;
export declare const updateProfileSchema: z.ZodObject<{
    fullName: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    avatarUrl: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    fullName?: string | undefined;
    phone?: string | undefined;
    avatarUrl?: string | undefined;
}, {
    fullName?: string | undefined;
    phone?: string | undefined;
    avatarUrl?: string | undefined;
}>;
export declare const updateRoleSchema: z.ZodObject<{
    role: z.ZodNativeEnum<{
        ADMIN: "ADMIN";
        USER: "USER";
    }>;
}, "strip", z.ZodTypeAny, {
    role: "ADMIN" | "USER";
}, {
    role: "ADMIN" | "USER";
}>;
export declare const updateStatusSchema: z.ZodObject<{
    isBlocked: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    isBlocked: boolean;
}, {
    isBlocked: boolean;
}>;
