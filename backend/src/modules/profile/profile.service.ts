import { Role } from '@prisma/client';
import prisma from '../../config/prisma.js';
import { supabaseAdmin, supabaseClient } from '../../config/supabase.js';
import { ApiError } from '../../utils/apiError.js';
import {
  uploadBufferToCloudinary,
  deleteFromCloudinary,
} from '../../utils/cloudinary.js';
import logger from '../../utils/logger.js';

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

const calculateCompletionPercent = (fields: Array<unknown>): number => {
  const filled = fields.filter((val) => {
    if (Array.isArray(val)) return val.length > 0;
    return val !== null && val !== undefined && String(val).trim() !== '';
  }).length;
  return Math.round((filled / fields.length) * 100);
};

export class ProfileService {
  /**
   * 1. Get complete profile for logged-in User or Admin
   */
  async getMyProfile(userId: string, role: Role) {
    if (role === Role.ADMIN) {
      const admin = await prisma.admin.findUnique({
        where: { id: userId },
        include: {
          _count: {
            select: {
              quotations: true,
              uploadedDocuments: true,
            },
          },
        },
      });

      if (!admin) {
        throw new ApiError(404, 'Admin profile not found.');
      }

      const profileCompletion = calculateCompletionPercent([
        admin.fullName,
        admin.phone,
        admin.avatarUrl,
        admin.department,
        admin.designation,
        admin.bio,
        admin.specializations,
        admin.country,
      ]);

      return {
        ...admin,
        role: Role.ADMIN,
        profileCompletion,
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            requests: true,
            payments: true,
          },
        },
      },
    });

    if (!user) {
      throw new ApiError(404, 'User profile not found.');
    }

    const profileCompletion = calculateCompletionPercent([
      user.fullName,
      user.phone,
      user.avatarUrl,
      user.bio,
      user.organization,
      user.country,
      user.city,
      user.address,
    ]);

    return {
      ...user,
      role: Role.USER,
      profileCompletion,
    };
  }

  /**
   * 2. Update profile details (role-isolated fields for User vs Admin)
   */
  async updateMyProfile(userId: string, role: Role, data: UpdateProfileInput) {
    if (role === Role.ADMIN) {
      const adminUpdateData: Record<string, any> = {
        ...(data.fullName !== undefined && { fullName: data.fullName }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
        ...(data.department !== undefined && { department: data.department }),
        ...(data.designation !== undefined && { designation: data.designation }),
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.specializations !== undefined && { specializations: data.specializations }),
        ...(data.country !== undefined && { country: data.country }),
        ...(data.city !== undefined && { city: data.city }),
        ...(data.timezone !== undefined && { timezone: data.timezone }),
        ...(data.notificationPreferences !== undefined && {
          notificationPreferences: data.notificationPreferences,
        }),
        ...(data.metadata !== undefined && { metadata: data.metadata }),
      };

      const updated = await prisma.admin.update({
        where: { id: userId },
        data: adminUpdateData,
      });

      await prisma.auditLog.create({
        data: {
          actorId: userId,
          actorRole: Role.ADMIN,
          adminActorId: userId,
          action: 'ADMIN_PROFILE_UPDATED',
          metadata: { updatedFields: Object.keys(adminUpdateData) },
        },
      });

      // Best-effort sync of fullName to Supabase Auth metadata
      if (data.fullName) {
        supabaseAdmin.auth.admin
          .updateUserById(userId, { user_metadata: { full_name: data.fullName } })
          .catch((err) => logger.warn('Supabase metadata sync skipped:', err?.message));
      }

      return this.getMyProfile(updated.id, Role.ADMIN);
    }

    // Regular User profile update
    const userUpdateData: Record<string, any> = {
      ...(data.fullName !== undefined && { fullName: data.fullName }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
      ...(data.bio !== undefined && { bio: data.bio }),
      ...(data.organization !== undefined && { organization: data.organization }),
      ...(data.country !== undefined && { country: data.country }),
      ...(data.city !== undefined && { city: data.city }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.timezone !== undefined && { timezone: data.timezone }),
      ...(data.notificationPreferences !== undefined && {
        notificationPreferences: data.notificationPreferences,
      }),
      ...(data.metadata !== undefined && { metadata: data.metadata }),
    };

    const updated = await prisma.user.update({
      where: { id: userId },
      data: userUpdateData,
    });

    await prisma.auditLog.create({
      data: {
        actorId: userId,
        actorRole: Role.USER,
        userActorId: userId,
        action: 'USER_PROFILE_UPDATED',
        metadata: { updatedFields: Object.keys(userUpdateData) },
      },
    });

    if (data.fullName) {
      supabaseAdmin.auth.admin
        .updateUserById(userId, { user_metadata: { full_name: data.fullName } })
        .catch((err) => logger.warn('Supabase metadata sync skipped:', err?.message));
    }

    return this.getMyProfile(updated.id, Role.USER);
  }

  /**
   * 3. Upload & replace profile avatar image via Cloudinary
   */
  async uploadAvatar(userId: string, role: Role, file: Express.Multer.File) {
    // 1. Fetch existing avatarPublicId so we can clean up old asset
    const existing =
      role === Role.ADMIN
        ? await prisma.admin.findUnique({
            where: { id: userId },
            select: { avatarPublicId: true },
          })
        : await prisma.user.findUnique({
            where: { id: userId },
            select: { avatarPublicId: true },
          });

    if (!existing) {
      throw new ApiError(404, 'Profile not found.');
    }

    // 2. Upload new avatar to Cloudinary
    const uploadRes = await uploadBufferToCloudinary(file.buffer, 'document-system/avatars', {
      resourceType: 'image',
      isPrivate: false,
    });

    // 3. Update DB record
    if (role === Role.ADMIN) {
      await prisma.admin.update({
        where: { id: userId },
        data: {
          avatarUrl: uploadRes.secureUrl,
          avatarPublicId: uploadRes.publicId,
        },
      });
    } else {
      await prisma.user.update({
        where: { id: userId },
        data: {
          avatarUrl: uploadRes.secureUrl,
          avatarPublicId: uploadRes.publicId,
        },
      });
    }

    // 4. Delete previous avatar from Cloudinary (non-blocking cleanup)
    if (existing.avatarPublicId && existing.avatarPublicId !== uploadRes.publicId) {
      deleteFromCloudinary(existing.avatarPublicId, 'image').catch((err) =>
        logger.warn('Old avatar cleanup failed:', err)
      );
    }

    // 5. Best-effort sync to Supabase Auth user_metadata
    supabaseAdmin.auth.admin
      .updateUserById(userId, { user_metadata: { avatar_url: uploadRes.secureUrl } })
      .catch((err) => logger.warn('Supabase avatar metadata sync skipped:', err?.message));

    await prisma.auditLog.create({
      data: {
        actorId: userId,
        actorRole: role,
        ...(role === Role.ADMIN ? { adminActorId: userId } : { userActorId: userId }),
        action: 'PROFILE_AVATAR_UPDATED',
      },
    });

    return {
      avatarUrl: uploadRes.secureUrl,
      avatarPublicId: uploadRes.publicId,
    };
  }

  /**
   * 4. Remove profile avatar and clean up from Cloudinary
   */
  async removeAvatar(userId: string, role: Role) {
    const existing =
      role === Role.ADMIN
        ? await prisma.admin.findUnique({
            where: { id: userId },
            select: { avatarPublicId: true },
          })
        : await prisma.user.findUnique({
            where: { id: userId },
            select: { avatarPublicId: true },
          });

    if (!existing) {
      throw new ApiError(404, 'Profile not found.');
    }

    if (existing.avatarPublicId) {
      await deleteFromCloudinary(existing.avatarPublicId, 'image');
    }

    if (role === Role.ADMIN) {
      await prisma.admin.update({
        where: { id: userId },
        data: { avatarUrl: null, avatarPublicId: null },
      });
    } else {
      await prisma.user.update({
        where: { id: userId },
        data: { avatarUrl: null, avatarPublicId: null },
      });
    }

    await prisma.auditLog.create({
      data: {
        actorId: userId,
        actorRole: role,
        ...(role === Role.ADMIN ? { adminActorId: userId } : { userActorId: userId }),
        action: 'PROFILE_AVATAR_REMOVED',
      },
    });

    return { avatarUrl: null };
  }

  /**
   * 5. Change password via Supabase Auth (verifies currentPassword if supplied)
   */
  async changePassword(
    userId: string,
    email: string,
    role: Role,
    params: { currentPassword?: string; newPassword: string }
  ) {
    if (!params.currentPassword) {
      throw new ApiError(400, 'Current password is required.');
    }

    const { error: signInError } = await supabaseClient.auth.signInWithPassword({
      email,
      password: params.currentPassword,
    });
    if (signInError) {
      throw new ApiError(400, 'Current password is incorrect.');
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: params.newPassword,
    });

    if (error) {
      throw new ApiError(400, error.message || 'Failed to update password.');
    }

    await prisma.auditLog.create({
      data: {
        actorId: userId,
        actorRole: role,
        ...(role === Role.ADMIN ? { adminActorId: userId } : { userActorId: userId }),
        action: 'PROFILE_PASSWORD_CHANGED',
      },
    });

    return { message: 'Password updated successfully.' };
  }
}

export const profileService = new ProfileService();
export default profileService;
