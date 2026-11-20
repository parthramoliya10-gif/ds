import { Role } from '@prisma/client';
export interface UpdateProfileInput {
    fullName?: string;
    phone?: string | null;
    avatarUrl?: string | null;
    bio?: string | null;
    organization?: string | null;
    country?: string | null;
    city?: string | null;
    address?: string | null;
    timezone?: string;
    department?: string | null;
    designation?: string | null;
    specializations?: string[];
    notificationPreferences?: Record<string, boolean>;
    metadata?: Record<string, unknown>;
}
export declare class ProfileService {
    /**
     * 1. Get complete profile for logged-in User or Admin
     */
    getMyProfile(userId: string, role: Role): Promise<{
        role: "ADMIN";
        profileCompletion: number;
        _count: {
            quotations: number;
            uploadedDocuments: number;
        };
        fullName: string | null;
        id: string;
        email: string;
        phone: string | null;
        avatarUrl: string | null;
        avatarPublicId: string | null;
        department: string | null;
        designation: string | null;
        bio: string | null;
        specializations: string[];
        country: string | null;
        city: string | null;
        timezone: string | null;
        notificationPreferences: import("@prisma/client/runtime/library").JsonValue | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        isSuperAdmin: boolean;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    } | {
        role: "USER";
        profileCompletion: number;
        _count: {
            requests: number;
            payments: number;
        };
        fullName: string | null;
        id: string;
        email: string;
        phone: string | null;
        avatarUrl: string | null;
        avatarPublicId: string | null;
        bio: string | null;
        country: string | null;
        city: string | null;
        timezone: string | null;
        notificationPreferences: import("@prisma/client/runtime/library").JsonValue | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
        organization: string | null;
        address: string | null;
        isBlocked: boolean;
    }>;
    /**
     * 2. Update profile details (role-isolated fields for User vs Admin)
     */
    updateMyProfile(userId: string, role: Role, data: UpdateProfileInput): Promise<{
        role: "ADMIN";
        profileCompletion: number;
        _count: {
            quotations: number;
            uploadedDocuments: number;
        };
        fullName: string | null;
        id: string;
        email: string;
        phone: string | null;
        avatarUrl: string | null;
        avatarPublicId: string | null;
        department: string | null;
        designation: string | null;
        bio: string | null;
        specializations: string[];
        country: string | null;
        city: string | null;
        timezone: string | null;
        notificationPreferences: import("@prisma/client/runtime/library").JsonValue | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        isSuperAdmin: boolean;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    } | {
        role: "USER";
        profileCompletion: number;
        _count: {
            requests: number;
            payments: number;
        };
        fullName: string | null;
        id: string;
        email: string;
        phone: string | null;
        avatarUrl: string | null;
        avatarPublicId: string | null;
        bio: string | null;
        country: string | null;
        city: string | null;
        timezone: string | null;
        notificationPreferences: import("@prisma/client/runtime/library").JsonValue | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
        organization: string | null;
        address: string | null;
        isBlocked: boolean;
    }>;
    /**
     * 3. Upload & replace profile avatar image via Cloudinary
     */
    uploadAvatar(userId: string, role: Role, file: Express.Multer.File): Promise<{
        avatarUrl: string;
        avatarPublicId: string;
    }>;
    /**
     * 4. Remove profile avatar and clean up from Cloudinary
     */
    removeAvatar(userId: string, role: Role): Promise<{
        avatarUrl: null;
    }>;
    /**
     * 5. Change password via Supabase Auth (verifies currentPassword if supplied)
     */
    changePassword(userId: string, email: string, role: Role, params: {
        currentPassword?: string;
        newPassword: string;
    }): Promise<{
        message: string;
    }>;
}
export declare const profileService: ProfileService;
export default profileService;
