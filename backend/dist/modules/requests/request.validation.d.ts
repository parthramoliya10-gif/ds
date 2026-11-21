import { z } from 'zod';
export declare const createRequestSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
    category: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    priority: z.ZodDefault<z.ZodEnum<["LOW", "NORMAL", "HIGH", "URGENT"]>>;
}, "strip", z.ZodTypeAny, {
    title: string;
    description: string;
    category: string;
    priority: "NORMAL" | "LOW" | "HIGH" | "URGENT";
}, {
    title: string;
    description: string;
    category?: string | undefined;
    priority?: "NORMAL" | "LOW" | "HIGH" | "URGENT" | undefined;
}>;
export declare const updateRequestStatusSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodNativeEnum<{
        PENDING: "PENDING";
        QUOTED: "QUOTED";
        IN_PROGRESS: "IN_PROGRESS";
        DOCUMENT_UPLOADED: "DOCUMENT_UPLOADED";
        COMPLETED: "COMPLETED";
        CANCELLED: "CANCELLED";
    }>>;
    isDownloadUnlocked: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    status?: "PENDING" | "QUOTED" | "IN_PROGRESS" | "DOCUMENT_UPLOADED" | "COMPLETED" | "CANCELLED" | undefined;
    isDownloadUnlocked?: boolean | undefined;
}, {
    status?: "PENDING" | "QUOTED" | "IN_PROGRESS" | "DOCUMENT_UPLOADED" | "COMPLETED" | "CANCELLED" | undefined;
    isDownloadUnlocked?: boolean | undefined;
}>;
