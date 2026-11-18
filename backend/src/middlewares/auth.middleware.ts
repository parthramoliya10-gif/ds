import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
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
      // Fallback to Supabase Admin Auth API
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

    // 4. First check separate Admins table
    const admin = await prisma.admin.findUnique({
      where: { id: userId },
    });

    if (admin) {
      if (!admin.isActive) {
        throw new ApiError(403, 'Admin account has been deactivated. Contact super admin.');
      }

      req.user = {
        id: admin.id,
        email: admin.email,
        role: Role.ADMIN,
        fullName: admin.fullName,
        avatarUrl: admin.avatarUrl,
        isBlocked: !admin.isActive,
      } as AuthenticatedUser;

      return next();
    }

    // 5. Otherwise check separate Users table
    let user = await prisma.user.findUnique({
      where: { id: userId },
    });

    // Failsafe: If user record doesn't exist yet, fetch details from Supabase Auth and create in users table
    if (!user) {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
      const userMeta = authUser?.user?.user_metadata || {};

      user = await prisma.user.create({
        data: {
          id: userId,
          email: email || authUser?.user?.email || '',
          fullName: userMeta.full_name || userMeta.name || null,
          avatarUrl: userMeta.avatar_url || userMeta.picture || null,
          isBlocked: false,
        },
      });
    }

    // 6. Check if user is blocked by admin
    if (user.isBlocked) {
      throw new ApiError(403, 'Your account has been suspended. Please contact support.');
    }

    // 7. Attach authenticated user to Express request
    req.user = {
      id: user.id,
      email: user.email,
      role: Role.USER,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      isBlocked: user.isBlocked,
    } as AuthenticatedUser;

    next();
  } catch (error) {
    next(error);
  }
};
