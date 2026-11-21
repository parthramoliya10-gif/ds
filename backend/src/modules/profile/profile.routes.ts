import { Router } from 'express';
import profileController from './profile.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validateRequest } from '../../middlewares/validate.middleware.js';
import { uploadProfileAvatar } from '../../middlewares/upload.middleware.js';
import { updateProfileSchema, changePasswordSchema } from './profile.validation.js';
import { cacheResponse } from '../../middlewares/cache.middleware.js';
import { CACHE_TTL } from '../../services/cache.service.js';

const router = Router();

// All profile endpoints require authentication (works seamlessly for both USER & ADMIN)
router.use(authenticate);

// 1. Fetch complete profile (Cached via Upstash Redis)
router.get(
  ['/', '/me'],
  cacheResponse({ ttlSeconds: CACHE_TTL.USER_PROFILE, keyPrefix: 'profile', userSpecific: true }),
  profileController.getMyProfile
);

// 2. Update profile details (role-isolated fields for User & Admin)
router.patch(
  ['/', '/me'],
  validateRequest({ body: updateProfileSchema }),
  profileController.updateMyProfile
);

// 3. Upload / replace avatar image to Cloudinary (JPEG/PNG/WEBP, max 5MB)
router.post('/avatar', uploadProfileAvatar, profileController.uploadAvatar);

// 4. Remove avatar image
router.delete('/avatar', profileController.removeAvatar);

// 5. Change account password
router.patch(
  '/password',
  validateRequest({ body: changePasswordSchema }),
  profileController.changePassword
);

export default router;
