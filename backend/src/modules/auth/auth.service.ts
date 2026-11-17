import { Role } from '@prisma/client';
import prisma from '../../config/prisma.js';
import { ApiError } from '../../utils/apiError.js';

export class AuthService {
  /**
   * Fetch current authenticated user's profile
   */
  async getProfile(userId: string) {
    const profile = await prisma.profile.findUnique({
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

    if (!profile) {
      throw new ApiError(404, 'User profile not found.');
    }

    return profile;
  }

  /**
   * Update profile fields (Full name, phone, avatar)
   */
  async updateProfile(
    userId: string,
    data: {
      fullName?: string;
      phone?: string;
      avatarUrl?: string;
    }
  ) {
    const updated = await prisma.profile.update({
      where: { id: userId },
      data: {
        ...(data.fullName !== undefined && { fullName: data.fullName }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
      },
    });

    return updated;
  }

  /**
   * Admin-only: Change user role (USER <-> ADMIN)
   */
  async updateUserRole(adminId: string, targetUserId: string, newRole: Role) {
    if (adminId === targetUserId) {
      throw new ApiError(400, 'Admins cannot change their own role.');
    }

    const updated = await prisma.profile.update({
      where: { id: targetUserId },
      data: { role: newRole },
    });

    // Log the role change to audit log
    await prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: 'ADMIN_ROLE_CHANGE',
        metadata: {
          targetUserId,
          newRole,
        },
      },
    });

    return updated;
  }

  /**
   * Admin-only: Block or unblock a user
   */
  async updateUserStatus(adminId: string, targetUserId: string, isBlocked: boolean) {
    if (adminId === targetUserId) {
      throw new ApiError(400, 'Admins cannot block themselves.');
    }

    const updated = await prisma.profile.update({
      where: { id: targetUserId },
      data: { isBlocked },
    });

    // Log the status change to audit log
    await prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: isBlocked ? 'ADMIN_USER_BLOCKED' : 'ADMIN_USER_UNBLOCKED',
        metadata: {
          targetUserId,
          isBlocked,
        },
      },
    });

    return updated;
  }
}

export const authService = new AuthService();
export default authService;
