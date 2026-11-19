"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.profileController = exports.ProfileController = void 0;
const profile_service_js_1 = __importDefault(require("./profile.service.js"));
const apiResponse_js_1 = require("../../utils/apiResponse.js");
const apiError_js_1 = require("../../utils/apiError.js");
class ProfileController {
    /**
     * GET /api/v1/profile
     * Fetch full profile for logged-in User or Admin
     */
    async getMyProfile(req, res, next) {
        try {
            if (!req.user) {
                throw new apiError_js_1.ApiError(401, 'Unauthorized');
            }
            const profile = await profile_service_js_1.default.getMyProfile(req.user.id, req.user.role);
            (0, apiResponse_js_1.sendResponse)({
                res,
                statusCode: 200,
                message: 'Profile retrieved successfully',
                data: profile,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * PATCH /api/v1/profile
     * Update profile fields for logged-in User or Admin
     */
    async updateMyProfile(req, res, next) {
        try {
            if (!req.user) {
                throw new apiError_js_1.ApiError(401, 'Unauthorized');
            }
            const updated = await profile_service_js_1.default.updateMyProfile(req.user.id, req.user.role, req.body);
            (0, apiResponse_js_1.sendResponse)({
                res,
                statusCode: 200,
                message: 'Profile updated successfully',
                data: updated,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/v1/profile/avatar
     * Upload / replace profile avatar photo
     */
    async uploadAvatar(req, res, next) {
        try {
            if (!req.user) {
                throw new apiError_js_1.ApiError(401, 'Unauthorized');
            }
            if (!req.file) {
                throw new apiError_js_1.ApiError(400, 'Please select an avatar image (JPEG, PNG, or WEBP).');
            }
            const result = await profile_service_js_1.default.uploadAvatar(req.user.id, req.user.role, req.file);
            (0, apiResponse_js_1.sendResponse)({
                res,
                statusCode: 200,
                message: 'Profile avatar uploaded successfully',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * DELETE /api/v1/profile/avatar
     * Remove profile avatar
     */
    async removeAvatar(req, res, next) {
        try {
            if (!req.user) {
                throw new apiError_js_1.ApiError(401, 'Unauthorized');
            }
            const result = await profile_service_js_1.default.removeAvatar(req.user.id, req.user.role);
            (0, apiResponse_js_1.sendResponse)({
                res,
                statusCode: 200,
                message: 'Profile avatar removed successfully',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * PATCH /api/v1/profile/password
     * Change account password
     */
    async changePassword(req, res, next) {
        try {
            if (!req.user) {
                throw new apiError_js_1.ApiError(401, 'Unauthorized');
            }
            const result = await profile_service_js_1.default.changePassword(req.user.id, req.user.email, req.user.role, req.body);
            (0, apiResponse_js_1.sendResponse)({
                res,
                statusCode: 200,
                message: result.message,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ProfileController = ProfileController;
exports.profileController = new ProfileController();
exports.default = exports.profileController;
//# sourceMappingURL=profile.controller.js.map