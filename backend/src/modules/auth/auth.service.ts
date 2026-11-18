import { Role } from '@prisma/client';
import prisma from '../../config/prisma.js';
import env from '../../config/env.js';
import { supabaseAdmin, supabaseClient } from '../../config/supabase.js';
import { ApiError } from '../../utils/apiError.js';

export class AuthService {
  /**
   * Internal helper: Ensure Supabase Auth user is synced with public.profiles
   */
  private async ensureProfileSynced(authUser: {
    id: string;
    email?: string;
    user_metadata?: Record<string, any>;
  }) {
    const meta = authUser.user_metadata || {};
    const profile = await prisma.profile.upsert({
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
        role: Role.USER,
        isBlocked: false,
      },
    });

    if (profile.isBlocked) {
      throw new ApiError(403, 'Your account has been suspended. Please contact support.');
    }

    return profile;
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
   * 3. Send Email OTP via Supabase Auth
   */
  async sendEmailOtp(email: string, fullName?: string) {
    const { error } = await supabaseClient.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        data: fullName ? { full_name: fullName } : undefined,
      },
    });

    if (error) {
      throw new ApiError(400, error.message);
    }

    return {
      email,
      message: 'OTP sent to your email address. Please check your inbox.',
    };
  }

  /**
   * 4. Verify Email OTP and create authenticated session
   */
  async verifyEmailOtp(email: string, token: string) {
    const { data, error } = await supabaseClient.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });

    if (error || !data.session || !data.user) {
      throw new ApiError(401, error?.message || 'Invalid or expired OTP.');
    }

    const profile = await this.ensureProfileSynced(data.user);

    await prisma.auditLog.create({
      data: {
        actorId: profile.id,
        action: 'USER_OTP_VERIFIED',
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
   * 5. Register with Email & Password (triggers email confirmation / OTP)
   */
  async registerWithEmail(email: string, password: string, fullName: string) {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${env.CLIENT_URL}/auth/callback`,
      },
    });

    if (error) {
      throw new ApiError(400, error.message);
    }

    let profile = null;
    if (data.user) {
      profile = await this.ensureProfileSynced(data.user);
    }

    return {
      profile,
      emailConfirmationRequired: !data.session,
      session: data.session
        ? {
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token,
          }
        : null,
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
