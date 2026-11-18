import multer from 'multer';
import { Request } from 'express';
import { ApiError } from '../utils/apiError.js';

// In-memory storage: file kept in Buffer for malware/validation check & Cloudinary stream
const storage = multer.memoryStorage();

const allowedMimeTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/webp',
];

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new ApiError(
        400,
        `Unsupported file type: ${file.mimetype}. Allowed types: PDF, DOC, DOCX, TXT, JPEG, PNG, WEBP`
      )
    );
  }
};

export const uploadReferenceFiles = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 5,                   // Maximum 5 files per request
  },
  fileFilter,
}).array('referenceFiles', 5);

export const uploadSingleFinalDocument = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for completed documents
  },
  fileFilter,
}).single('document');

const allowedAvatarMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

const avatarFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (allowedAvatarMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new ApiError(
        400,
        `Unsupported avatar image type: ${file.mimetype}. Allowed types: JPEG, PNG, WEBP`
      )
    );
  }
};

export const uploadProfileAvatar = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max for profile avatars
  },
  fileFilter: avatarFileFilter,
}).single('avatar');
