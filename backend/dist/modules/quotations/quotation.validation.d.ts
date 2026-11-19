import { z } from 'zod';
export declare const createQuotationSchema: z.ZodObject<{
    requestId: z.ZodString;
    totalAmount: z.ZodNumber;
    terms: z.ZodOptional<z.ZodString>;
    estimatedDays: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    requestId: string;
    totalAmount: number;
    terms?: string | undefined;
    estimatedDays?: number | undefined;
}, {
    requestId: string;
    totalAmount: number;
    terms?: string | undefined;
    estimatedDays?: number | undefined;
}>;
export declare const rejectQuotationSchema: z.ZodObject<{
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    reason?: string | undefined;
}, {
    reason?: string | undefined;
}>;
