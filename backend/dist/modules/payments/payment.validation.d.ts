import { z } from 'zod';
export declare const createOrderSchema: z.ZodObject<{
    requestId: z.ZodString;
    milestone: z.ZodNativeEnum<{
        ADVANCE_50: "ADVANCE_50";
        FINAL_50: "FINAL_50";
    }>;
}, "strip", z.ZodTypeAny, {
    requestId: string;
    milestone: "ADVANCE_50" | "FINAL_50";
}, {
    requestId: string;
    milestone: "ADVANCE_50" | "FINAL_50";
}>;
export declare const verifyPaymentSchema: z.ZodObject<{
    razorpayOrderId: z.ZodString;
    razorpayPaymentId: z.ZodString;
    razorpaySignature: z.ZodString;
}, "strip", z.ZodTypeAny, {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
}, {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
}>;
