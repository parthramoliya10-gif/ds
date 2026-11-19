"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFromCloudinary = exports.generateSignedDownloadUrl = exports.uploadBufferToCloudinary = void 0;
const cloudinary_js_1 = __importDefault(require("../config/cloudinary.js"));
const apiError_js_1 = require("./apiError.js");
const logger_js_1 = __importDefault(require("./logger.js"));
/**
 * Upload a memory buffer (from Multer) directly to Cloudinary
 */
const uploadBufferToCloudinary = async (buffer, folder, options = {}) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary_js_1.default.uploader.upload_stream({
            folder,
            resource_type: options.resourceType || 'auto',
            type: options.isPrivate ? 'authenticated' : 'upload',
            public_id: options.publicId,
        }, (error, result) => {
            if (error || !result) {
                logger_js_1.default.error('Cloudinary upload error:', error);
                return reject(new apiError_js_1.ApiError(500, `Failed to upload file to Cloudinary: ${error?.message || 'Unknown error'}`));
            }
            resolve({
                publicId: result.public_id,
                secureUrl: result.secure_url,
                format: result.format || '',
                bytes: result.bytes,
                resourceType: result.resource_type,
            });
        });
        uploadStream.end(buffer);
    });
};
exports.uploadBufferToCloudinary = uploadBufferToCloudinary;
/**
 * Generate a short-lived signed URL for downloading authenticated/private assets
 * Expire time default: 2 minutes (120 seconds)
 */
const generateSignedDownloadUrl = (publicId, format = 'pdf', expiresInSeconds = 120, options = {}) => {
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const signedUrl = cloudinary_js_1.default.utils.private_download_url(publicId, format, {
        resource_type: options.resourceType || 'image',
        type: options.type || 'authenticated',
        expires_at: expiresAt,
        attachment: true,
    });
    return signedUrl;
};
exports.generateSignedDownloadUrl = generateSignedDownloadUrl;
/**
 * Delete an asset from Cloudinary
 */
const deleteFromCloudinary = async (publicId, resourceType = 'raw') => {
    try {
        await cloudinary_js_1.default.uploader.destroy(publicId, { resource_type: resourceType });
    }
    catch (error) {
        logger_js_1.default.error(`Failed to delete asset ${publicId} from Cloudinary:`, error);
    }
};
exports.deleteFromCloudinary = deleteFromCloudinary;
//# sourceMappingURL=cloudinary.js.map