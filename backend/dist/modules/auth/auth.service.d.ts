import { Role } from '@prisma/client';
export declare class AuthService {
    /**
     * Internal helper: Sync Supabase Auth user with separate admins / users tables
     */
    private ensureProfileSynced;
    /**
     * 1. Generate Google OAuth Login URL via Supabase Auth
     */
    getGoogleOAuthUrl(redirectTo?: string): Promise<{
        url: string;
        provider: string;
        redirectTo: string;
    }>;
    /**
     * 2. Establish HttpOnly Session after Google OAuth Callback (Code or Tokens)
     */
    establishSession(params: {
        code?: string;
        accessToken?: string;
        refreshToken?: string;
    }): Promise<{
        profile: {
            role: Role;
            isBlocked: boolean;
            id: string;
            email: string;
            fullName: string | null;
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
            role: Role;
            id: string;
            email: string;
            fullName: string | null;
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
        };
        session: {
            accessToken: string;
            refreshToken: string;
        };
    }>;
    /**
     * 3. Send Email OTP via Supabase Auth
     */
    sendEmailOtp(email: string, fullName?: string): Promise<{
        email: string;
        message: string;
    }>;
    /**
     * 4. Verify Email OTP and create authenticated session
     */
    verifyEmailOtp(email: string, token: string): Promise<{
        profile: {
            role: Role;
            isBlocked: boolean;
            id: string;
            email: string;
            fullName: string | null;
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
            role: Role;
            id: string;
            email: string;
            fullName: string | null;
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
        };
        session: {
            accessToken: string;
            refreshToken: string;
        };
    }>;
    /**
     * 5. Register with Email & Password (triggers email confirmation / OTP)
     */
    registerWithEmail(email: string, password: string, fullName: string): Promise<{
        profile: {
            role: Role;
            isBlocked: boolean;
            id: string;
            email: string;
            fullName: string | null;
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
            role: Role;
            id: string;
            email: string;
            fullName: string | null;
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
        } | null;
        emailConfirmationRequired: boolean;
        session: {
            accessToken: string;
            refreshToken: string;
        } | null;
    }>;
    /**
     * 6. Login with Email & Password
     */
    loginWithPassword(email: string, password: string): Promise<{
        profile: {
            role: Role;
            isBlocked: boolean;
            id: string;
            email: string;
            fullName: string | null;
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
            role: Role;
            id: string;
            email: string;
            fullName: string | null;
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
        };
        session: {
            accessToken: string;
            refreshToken: string;
        };
    }>;
    /**
     * 7. Forgot Password (sends email reset link via Supabase)
     */
    forgotPassword(email: string, redirectTo?: string): Promise<{
        message: string;
    }>;
    /**
     * 8. Refresh expired Access Token using HttpOnly refresh token
     */
    refreshSession(refreshToken: string): Promise<{
        profile: {
            role: Role;
            isBlocked: boolean;
            id: string;
            email: string;
            fullName: string | null;
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
            role: Role;
            id: string;
            email: string;
            fullName: string | null;
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
        };
        session: {
            accessToken: string;
            refreshToken: string;
        };
    }>;
    /**
     * Fetch current authenticated user or admin profile from its dedicated table
     */
    getProfile(userId: string, role: Role): Promise<{
        role: "ADMIN";
        _count: {
            quotations: number;
            uploadedDocuments: number;
        };
        id: string;
        email: string;
        fullName: string | null;
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
        _count: {
            requests: number;
            payments: number;
        };
        id: string;
        email: string;
        fullName: string | null;
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
     * Update profile fields (Full name, phone, avatar) in dedicated Admin or User table
     */
    updateProfile(userId: string, role: Role, data: {
        fullName?: string;
        phone?: string;
        avatarUrl?: string;
    }): Promise<{
        role: "ADMIN";
        id: string;
        email: string;
        fullName: string | null;
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
        id: string;
        email: string;
        fullName: string | null;
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
     * Admin-only: Promote User into Admins table OR Demote Admin into Users table
     */
    updateUserRole(adminId: string, targetUserId: string, newRole: Role): Promise<{
        role: "ADMIN";
        id: string;
        email: string;
        fullName: string | null;
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
        id: string;
        email: string;
        fullName: string | null;
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
     * Admin-only: Block or unblock a user in the Users table
     */
    updateUserStatus(adminId: string, targetUserId: string, isBlocked: boolean): Promise<{
        role: "USER";
        id: string;
        email: string;
        fullName: string | null;
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
}
export declare const authService: AuthService;
export default authService;
