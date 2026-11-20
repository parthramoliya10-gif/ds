import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import prisma from '../../config/prisma.js';
import env from '../../config/env.js';
import { supabaseAdmin, supabaseClient } from '../../config/supabase.js';
import { ApiError } from '../../utils/apiError.js';
import otpStore from './otp.store.js';
import { sendOtpEmail } from '../../utils/email.js';
import logger from '../../utils/logger.js';

export class AuthService {
  /**
   * Internal helper: Sync Supabase Auth user with separate admins / users tables
   */
  private async ensureProfileSynced(authUser: {
    id: string;
    email?: string;
    user_metadata?: Record<string, any>;
  }) {
    const meta = authUser.user_metadata || {};

    // 1. Check Admins table first
    const existingAdmin = await prisma.admin.findUnique({
      where: { id: authUser.id },
    });

    if (existingAdmin) {
      if (!existingAdmin.isActive) {
        throw new ApiError(403, 'Admin account has been deactivated. Contact super admin.');
      }
      const updatedAdmin = await prisma.admin.update({
        where: { id: authUser.id },
        data: {
          email: authUser.email || existingAdmin.email,
          fullName: meta.full_name || meta.name || existingAdmin.fullName,
          avatarUrl: meta.avatar_url || meta.picture || existingAdmin.avatarUrl,
        },
      });
      return {
        ...updatedAdmin,
        role: Role.ADMIN as Role,
        isBlocked: !updatedAdmin.isActive,
      };
    }

    // 2. Otherwise upsert into Users table
    const user = await prisma.user.upsert({
      where: { id: authUser.id },
      update: {
        email: authUser.email || undefined,
        fullName: meta.full_name || meta.name || undefined,
        avatarUrl: meta.avatar_url || meta.picture || undefined,
      },
      create: {
        id: authUser.id,
        email: authUser.email || '',
        fullName: meta.full_name || meta.name || null,
        avatarUrl: meta.avatar_url || meta.picture || null,
        isBlocked: false,
      },
    });

    if (user.isBlocked) {
      throw new ApiError(403, 'Your account has been suspended. Please contact support.');
    }

    return {
      ...user,
      role: Role.USER as Role,
    };
  }

  /**
   * 1. Generate Google OAuth Login URL via Supabase Auth
   */
  async getGoogleOAuthUrl(redirectTo?: string) {
    const callbackUrl = redirectTo || `${env.CLIENT_URL}/auth/callback`;

    const { data, error } = await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl,
        skipBrowserRedirect: true,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error || !data?.url) {
      throw new ApiError(500, error?.message || 'Failed to generate Google OAuth URL.');
    }

    return {
      url: data.url,
      provider: 'google',
      redirectTo: callbackUrl,
    };
  }

  /**
   * 2. Establish HttpOnly Session after Google OAuth Callback (Code or Tokens)
   */
  async establishSession(params: {
    code?: string;
    accessToken?: string;
    refreshToken?: string;
  }) {
    let accessToken = params.accessToken;
    let refreshToken = params.refreshToken;
    let authUser: any;

    if (params.code) {
      const { data, error } = await supabaseClient.auth.exchangeCodeForSession(params.code);
      if (error || !data.session || !data.user) {
        throw new ApiError(401, error?.message || 'Invalid or expired OAuth code.');
      }
      accessToken = data.session.access_token;
      refreshToken = data.session.refresh_token;
      authUser = data.user;
    } else if (accessToken) {
      const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
      if (error || !data.user) {
        throw new ApiError(401, error?.message || 'Invalid or expired access token.');
      }
      authUser = data.user;
    } else {
      throw new ApiError(400, 'OAuth code or accessToken is required.');
    }

    const profile = await this.ensureProfileSynced(authUser);

    await prisma.auditLog.create({
      data: {
        actorId: profile.id,
        actorRole: profile.role,
        ...(profile.role === Role.ADMIN
          ? { adminActorId: profile.id }
          : { userActorId: profile.id }),
        action: 'USER_OAUTH_LOGIN',
        metadata: { provider: authUser.app_metadata?.provider || 'google' },
      },
    });

    return {
      profile,
      session: {
        accessToken: accessToken!,
        refreshToken: refreshToken || '',
      },
    };
  }

  /**
   * Internal helper: Generate a valid signed JWT for session
   */
  private generateCustomJwtToken(authUser: { id: string; email?: string }): string {
    const payload = {
      sub: authUser.id,
      email: authUser.email,
      role: 'authenticated',
      aud: 'authenticated',
      iss: env.SUPABASE_URL ? `${env.SUPABASE_URL}/auth/v1` : 'dsms',
    };
    return jwt.sign(payload, env.SUPABASE_JWT_SECRET, { expiresIn: '7d' });
  }

  /**
   * 3. Send Email OTP (Custom 6-digit code via Resend)
   */
  async sendEmailOtp(email: string, fullName?: string) {
    const normalizedEmail = email.trim().toLowerCase();

    // Generate cryptographic 6-digit OTP stored in memory with 10-minute TTL
    const { code, expiresAt } = otpStore.createOtp(normalizedEmail, 'LOGIN', {
      email: normalizedEmail,
      fullName,
    });

    // Dispatch branded DSMS verification email
    await sendOtpEmail({
      to: normalizedEmail,
      otp: code,
      fullName,
      type: 'LOGIN',
    });

    return {
      email: normalizedEmail,
      expiresAt,
      message: 'A 6-digit verification code has been sent to your email address.',
    };
  }

  /**
   * 4. Verify Email OTP and create authenticated session
   */
  async verifyEmailOtp(email: string, token: string) {
    const normalizedEmail = email.trim().toLowerCase();

    // Verify token against OtpStore (checks SIGNUP first, then LOGIN)
    let verification: { success: boolean; data?: Record<string, any> };
    try {
      verification = otpStore.verifyOtp(normalizedEmail, token, 'SIGNUP');
    } catch (err: any) {
      try {
        verification = otpStore.verifyOtp(normalizedEmail, token, 'LOGIN');
      } catch {
        throw err;
      }
    }

    const regData = verification.data || {};
    let authUser: any;

    // Check if user already exists in Supabase Auth
    const { data: existingAuthUsers } = await supabaseAdmin.auth.admin.listUsers();
    const foundUser = existingAuthUsers?.users.find(
      (u) => u.email?.toLowerCase() === normalizedEmail
    );

    if (!foundUser) {
      // Create confirmed user in Supabase Auth via Admin API
      const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        password: regData.password || crypto.randomBytes(16).toString('hex'),
        email_confirm: true,
        user_metadata: {
          full_name: regData.fullName || 'User',
        },
      });

      if (createErr || !newUser?.user) {
        throw new ApiError(500, createErr?.message || 'Failed to create authenticated account.');
      }
      authUser = newUser.user;
    } else {
      const updatePayload: { email_confirm: boolean; password?: string } = {
        email_confirm: true,
      };
      if (regData.password) {
        updatePayload.password = regData.password;
      }
      await supabaseAdmin.auth.admin.updateUserById(foundUser.id, updatePayload);
      authUser = foundUser;
    }

    // Ensure user record is synced into PostgreSQL users / admins table
    const profile = await this.ensureProfileSynced(authUser);

    // Generate Session Tokens
    let accessToken: string;
    let refreshToken: string = '';

    if (regData.password) {
      const { data: signInRes, error: signInErr } = await supabaseClient.auth.signInWithPassword({
        email: normalizedEmail,
        password: regData.password,
      });
      if (signInRes?.session) {
        accessToken = signInRes.session.access_token;
        refreshToken = signInRes.session.refresh_token;
      } else {
        logger.warn(`[OTP] Supabase signInWithPassword fallback for ${normalizedEmail}: ${signInErr?.message}`);
        accessToken = this.generateCustomJwtToken(authUser);
      }
    } else {
      accessToken = this.generateCustomJwtToken(authUser);
    }

    await prisma.auditLog.create({
      data: {
        actorId: profile.id,
        actorRole: profile.role,
        ...(profile.role === Role.ADMIN
          ? { adminActorId: profile.id }
          : { userActorId: profile.id }),
        action: 'USER_OTP_VERIFIED',
        metadata: { email: normalizedEmail },
      },
    });

    return {
      profile,
      session: {
        accessToken,
        refreshToken,
      },
    };
  }

  /**
   * 5. Register with Email & Password (generates custom 6-digit OTP & sends branded Resend email)
   */
  async registerWithEmail(email: string, password: string, fullName: string) {
    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists in PostgreSQL
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    const existingAdmin = await prisma.admin.findUnique({ where: { email: normalizedEmail } });
    if (existingUser || existingAdmin) {
      throw new ApiError(409, 'An account with this email address already exists. Please log in.');
    }

    // Generate cryptographic 6-digit OTP stored in memory with 10-minute TTL
    const { code, expiresAt } = otpStore.createOtp(normalizedEmail, 'SIGNUP', {
      email: normalizedEmail,
      password,
      fullName,
    });

    // Dispatch branded DSMS verification email via Resend
    await sendOtpEmail({
      to: normalizedEmail,
      otp: code,
      fullName,
      type: 'SIGNUP',
    });

    return {
      email: normalizedEmail,
      emailConfirmationRequired: true,
      expiresAt,
      devOtp: env.NODE_ENV !== 'production' ? code : undefined,
      message: 'A 6-digit verification code has been sent to your email address.',
    };
  }

  /**
   * 6. Login with Email & Password
   */
  async loginWithPassword(email: string, password: string) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session || !data.user) {
      throw new ApiError(401, error?.message || 'Invalid email or password.');
    }

    const profile = await this.ensureProfileSynced(data.user);

    await prisma.auditLog.create({
      data: {
        actorId: profile.id,
        actorRole: profile.role,
        ...(profile.role === Role.ADMIN
          ? { adminActorId: profile.id }
          : { userActorId: profile.id }),
        action: 'USER_EMAIL_LOGIN',
      },
    });

    return {
      profile,
      session: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
      },
    };
  }

  /**
   * 7. Forgot Password (sends email reset link via Supabase)
   */
  async forgotPassword(email: string, redirectTo?: string) {
    const resetRedirect = redirectTo || `${env.CLIENT_URL}/reset-password`;
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: resetRedirect,
    });

    if (error) {
      throw new ApiError(400, error.message);
    }

    return {
      message: 'If an account exists with this email, a password reset link has been sent.',
    };
  }

  /**
   * 8. Refresh expired Access Token using HttpOnly refresh token
   */
  async refreshSession(refreshToken: string) {
    const { data, error } = await supabaseClient.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session || !data.user) {
      throw new ApiError(401, 'Session expired. Please log in again.');
    }

    const profile = await this.ensureProfileSynced(data.user);

    return {
      profile,
      session: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
      },
    };
  }

  /**
   * Fetch current authenticated user or admin profile from its dedicated table
   */
  async getProfile(userId: string, role: Role) {
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
      return { ...admin, role: Role.ADMIN };
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

    return { ...user, role: Role.USER };
  }

  /**
   * Update profile fields (Full name, phone, avatar) in dedicated Admin or User table
   */
  async updateProfile(
    userId: string,
    role: Role,
    data: {
      fullName?: string;
      phone?: string;
      avatarUrl?: string;
    }
  ) {
    const updatePayload = {
      ...(data.fullName !== undefined && { fullName: data.fullName }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
    };

    if (role === Role.ADMIN) {
      const updated = await prisma.admin.update({
        where: { id: userId },
        data: updatePayload,
      });
      return { ...updated, role: Role.ADMIN };
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updatePayload,
    });
    return { ...updated, role: Role.USER };
  }

  /**
   * Admin-only: Promote User into Admins table OR Demote Admin into Users table
   */
  async updateUserRole(adminId: string, targetUserId: string, newRole: Role) {
    if (adminId === targetUserId) {
      throw new ApiError(400, 'Admins cannot change their own role.');
    }

    if (newRole === Role.ADMIN) {
      const existingUser = await prisma.user.findUnique({ where: { id: targetUserId } });
      if (!existingUser) {
        throw new ApiError(404, 'Target user not found in users table.');
      }

      const promotedAdmin = await prisma.admin.upsert({
        where: { id: targetUserId },
        update: {
          isActive: true,
          email: existingUser.email,
          fullName: existingUser.fullName,
          phone: existingUser.phone,
          avatarUrl: existingUser.avatarUrl,
        },
        create: {
          id: existingUser.id,
          email: existingUser.email,
          fullName: existingUser.fullName,
          phone: existingUser.phone,
          avatarUrl: existingUser.avatarUrl,
          isActive: true,
        },
      });

      await prisma.auditLog.create({
        data: {
          actorId: adminId,
          actorRole: Role.ADMIN,
          adminActorId: adminId,
          action: 'ADMIN_ROLE_PROMOTED',
          metadata: { targetUserId, newRole },
        },
      });

      return { ...promotedAdmin, role: Role.ADMIN };
    } else {
      const existingAdmin = await prisma.admin.findUnique({ where: { id: targetUserId } });
      if (!existingAdmin) {
        throw new ApiError(404, 'Target admin not found in admins table.');
      }

      const demotedUser = await prisma.$transaction(async (tx) => {
        await tx.admin.delete({ where: { id: targetUserId } });
        return tx.user.upsert({
          where: { id: targetUserId },
          update: { email: existingAdmin.email },
          create: {
            id: existingAdmin.id,
            email: existingAdmin.email,
            fullName: existingAdmin.fullName,
            phone: existingAdmin.phone,
            avatarUrl: existingAdmin.avatarUrl,
            isBlocked: false,
          },
        });
      });

      await prisma.auditLog.create({
        data: {
          actorId: adminId,
          actorRole: Role.ADMIN,
          adminActorId: adminId,
          action: 'ADMIN_ROLE_DEMOTED',
          metadata: { targetUserId, newRole },
        },
      });

      return { ...demotedUser, role: Role.USER };
    }
  }

  /**
   * Admin-only: Block or unblock a user in the Users table
   */
  async updateUserStatus(adminId: string, targetUserId: string, isBlocked: boolean) {
    if (adminId === targetUserId) {
      throw new ApiError(400, 'Admins cannot block themselves.');
    }

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: { isBlocked },
    });

    await prisma.auditLog.create({
      data: {
        actorId: adminId,
        actorRole: Role.ADMIN,
        adminActorId: adminId,
        action: isBlocked ? 'ADMIN_USER_BLOCKED' : 'ADMIN_USER_UNBLOCKED',
        metadata: {
          targetUserId,
          isBlocked,
        },
      },
    });

    return { ...updated, role: Role.USER };
  }
}

export const authService = new AuthService();
export default authService;
