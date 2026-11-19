"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const profile_controller_js_1 = __importDefault(require("./profile.controller.js"));
const auth_middleware_js_1 = require("../../middlewares/auth.middleware.js");
const validate_middleware_js_1 = require("../../middlewares/validate.middleware.js");
const upload_middleware_js_1 = require("../../middlewares/upload.middleware.js");
const profile_validation_js_1 = require("./profile.validation.js");
const router = (0, express_1.Router)();
// All profile endpoints require authentication (works seamlessly for both USER & ADMIN)
router.use(auth_middleware_js_1.authenticate);
// 1. Fetch complete profile (with completion percentage & stats)
router.get(['/', '/me'], profile_controller_js_1.default.getMyProfile);
// 2. Update profile details (role-isolated fields for User & Admin)
router.patch(['/', '/me'], (0, validate_middleware_js_1.validateRequest)({ body: profile_validation_js_1.updateProfileSchema }), profile_controller_js_1.default.updateMyProfile);
// 3. Upload / replace avatar image to Cloudinary (JPEG/PNG/WEBP, max 5MB)
router.post('/avatar', upload_middleware_js_1.uploadProfileAvatar, profile_controller_js_1.default.uploadAvatar);
// 4. Remove avatar image
router.delete('/avatar', profile_controller_js_1.default.removeAvatar);
// 5. Change account password
router.patch('/password', (0, validate_middleware_js_1.validateRequest)({ body: profile_validation_js_1.changePasswordSchema }), profile_controller_js_1.default.changePassword);
exports.default = router;
//# sourceMappingURL=profile.routes.js.map