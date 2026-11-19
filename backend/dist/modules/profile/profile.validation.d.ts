import { z } from 'zod';
export declare const updateProfileSchema: z.ZodObject<{
    fullName: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    avatarUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    bio: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    country: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    city: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    timezone: z.ZodOptional<z.ZodString>;
    notificationPreferences: z.ZodOptional<z.ZodObject<{
        emailNotifications: z.ZodOptional<z.ZodBoolean>;
        chatNotifications: z.ZodOptional<z.ZodBoolean>;
        paymentAlerts: z.ZodOptional<z.ZodBoolean>;
        documentAlerts: z.ZodOptional<z.ZodBoolean>;
    }, "strict", z.ZodTypeAny, {
        emailNotifications?: boolean | undefined;
        chatNotifications?: boolean | undefined;
        paymentAlerts?: boolean | undefined;
        documentAlerts?: boolean | undefined;
    }, {
        emailNotifications?: boolean | undefined;
        chatNotifications?: boolean | undefined;
        paymentAlerts?: boolean | undefined;
        documentAlerts?: boolean | undefined;
    }>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    organization: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    address: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    department: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    designation: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    specializations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    fullName?: string | undefined;
    phone?: string | null | undefined;
    avatarUrl?: string | null | undefined;
    department?: string | null | undefined;
    designation?: string | null | undefined;
    bio?: string | null | undefined;
    specializations?: string[] | undefined;
    country?: string | null | undefined;
    city?: string | null | undefined;
    timezone?: string | undefined;
    notificationPreferences?: {
        emailNotifications?: boolean | undefined;
        chatNotifications?: boolean | undefined;
        paymentAlerts?: boolean | undefined;
        documentAlerts?: boolean | undefined;
    } | undefined;
    metadata?: Record<string, unknown> | undefined;
    organization?: string | null | undefined;
    address?: string | null | undefined;
}, {
    fullName?: string | undefined;
    phone?: string | null | undefined;
    avatarUrl?: string | null | undefined;
    department?: string | null | undefined;
    designation?: string | null | undefined;
    bio?: string | null | undefined;
    specializations?: string[] | undefined;
    country?: string | null | undefined;
    city?: string | null | undefined;
    timezone?: string | undefined;
    notificationPreferences?: {
        emailNotifications?: boolean | undefined;
        chatNotifications?: boolean | undefined;
        paymentAlerts?: boolean | undefined;
        documentAlerts?: boolean | undefined;
    } | undefined;
    metadata?: Record<string, unknown> | undefined;
    organization?: string | null | undefined;
    address?: string | null | undefined;
}>;
export declare const changePasswordSchema: z.ZodObject<{
    currentPassword: z.ZodOptional<z.ZodString>;
    newPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    newPassword: string;
    currentPassword?: string | undefined;
}, {
    newPassword: string;
    currentPassword?: string | undefined;
}>;
