import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import cloudinary from '../config/cloudinary.js';
import { ApiError } from './apiError.js';
import logger from './logger.js';

export interface CloudinaryUploadResult {
  publicId: string;
  secureUrl: string;
  format: string;
  bytes: number;
  resourceType: string;
}

/**
 * Upload a memory buffer (from Multer) directly to Cloudinary
 */
export const uploadBufferToCloudinary = async (
  buffer: Buffer,
  folder: string,
  options: {
    resourceType?: 'auto' | 'image' | 'raw' | 'video';
    publicId?: string;
    isPrivate?: boolean;
  } = {}
): Promise<CloudinaryUploadResult> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: options.resourceType || 'auto',
        type: options.isPrivate ? 'authenticated' : 'upload',
        public_id: options.publicId,
      },
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error || !result) {
          logger.error('Cloudinary upload error:', error);
          return reject(
            new ApiError(500, `Failed to upload file to Cloudinary: ${error?.message || 'Unknown error'}`)
          );
        }
        resolve({
          publicId: result.public_id,
          secureUrl: result.secure_url,
          format: result.format || '',
          bytes: result.bytes,
          resourceType: result.resource_type,
        });
      }
    );

    uploadStream.end(buffer);
  });
};

/**
 * Generate a short-lived signed URL for downloading authenticated/private assets
 * Expire time default: 5 minutes (300 seconds)
 */
export const generateSignedDownloadUrl = (
  publicId: string,
  format: string = 'pdf',
  expiresInSeconds: number = 300
): string => {
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;

  const signedUrl = cloudinary.utils.private_download_url(publicId, format, {
    expires_at: expiresAt,
    attachment: true,
  });

  return signedUrl;
};

/**
 * Delete an asset from Cloudinary
 */
export const deleteFromCloudinary = async (
  publicId: string,
  resourceType: 'image' | 'raw' | 'video' = 'raw'
): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (error) {
    logger.error(`Failed to delete asset ${publicId} from Cloudinary:`, error);
  }
};
