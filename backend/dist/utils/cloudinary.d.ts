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
export declare const uploadBufferToCloudinary: (buffer: Buffer, folder: string, options?: {
    resourceType?: "auto" | "image" | "raw" | "video";
    publicId?: string;
    isPrivate?: boolean;
}) => Promise<CloudinaryUploadResult>;
/**
 * Generate a short-lived signed URL for downloading authenticated/private assets
 * Expire time default: 2 minutes (120 seconds)
 */
export declare const generateSignedDownloadUrl: (publicId: string, format?: string, expiresInSeconds?: number, options?: {
    resourceType?: "image" | "raw" | "video";
    type?: "authenticated" | "private" | "upload";
}) => string;
/**
 * Delete an asset from Cloudinary
 */
export declare const deleteFromCloudinary: (publicId: string, resourceType?: "image" | "raw" | "video") => Promise<void>;
