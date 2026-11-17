import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import prisma from '../config/prisma.js';
import { supabaseAdmin } from '../config/supabase.js';
import { ApiError } from '../utils/apiError.js';
import { AuthenticatedUser } from '../types/express.js';

interface SupabaseJwtPayload {
  sub: string;
  email?: string;
  role?: string;
  exp?: number;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // 1. Extract token from Authorization Bearer header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    // 2. Or fallback to cookies (HttpOnly session cookie)
    else if (req.cookies) {
      token =
        req.cookies['sb-access-token'] ||
        req.cookies['access_token'] ||
        req.cookies['supabase-auth-token'];
    }

    if (!token) {
      throw new ApiError(401, 'Authentication token missing. Please log in.');
    }

    let userId: string | undefined;
    let email: string | undefined;

    // 3. Try verifying token signature using SUPABASE_JWT_SECRET
    try {
      const decoded = jwt.verify(token, env.SUPABASE_JWT_SECRET) as SupabaseJwtPayload;
      userId = decoded.sub;
      email = decoded.email;
    } catch (jwtErr) {
      // If local secret verification fails (e.g., algorithm mismatch or new key),
      // verify using Supabase Admin Auth API
      const { data: authUser, error: authError } = await supabaseAdmin.auth.getUser(token);
      if (authError || !authUser?.user) {
        throw new ApiError(401, 'Invalid or expired session. Please log in again.');
      }
      userId = authUser.user.id;
      email = authUser.user.email;
    }

    if (!userId) {
      throw new ApiError(401, 'Invalid token payload: user identifier missing.');
    }

    // 4. Fetch user profile from database
    let profile = await prisma.profile.findUnique({
      where: { id: userId },
    });

    // Failsafe: If profile doesn't exist yet, fetch details from Supabase Auth and create it
    if (!profile) {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
      const userMeta = authUser?.user?.user_metadata || {};

      profile = await prisma.profile.create({
        data: {
          id: userId,
          email: email || authUser?.user?.email || '',
          fullName: userMeta.full_name || userMeta.name || null,
          avatarUrl: userMeta.avatar_url || null,
          role: 'USER',
          isBlocked: false,
        },
      });
    }

    // 5. Check if user is blocked by admin
    if (profile.isBlocked) {
      throw new ApiError(403, 'Your account has been suspended. Please contact support.');
    }

    // 6. Attach authenticated user to Express request
    req.user = {
      id: profile.id,
      email: profile.email,
      role: profile.role,
      fullName: profile.fullName,
      avatarUrl: profile.avatarUrl,
      isBlocked: profile.isBlocked,
    } as AuthenticatedUser;

    next();
  } catch (error) {
    next(error);
  }
};
