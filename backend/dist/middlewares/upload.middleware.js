"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadProfileAvatar = exports.uploadSingleFinalDocument = exports.uploadReferenceFiles = void 0;
const multer_1 = __importDefault(require("multer"));
const apiError_js_1 = require("../utils/apiError.js");
// In-memory storage: file kept in Buffer for malware/validation check & Cloudinary stream
const storage = multer_1.default.memoryStorage();
const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/webp',
];
const fileFilter = (_req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new apiError_js_1.ApiError(400, `Unsupported file type: ${file.mimetype}. Allowed types: PDF, DOC, DOCX, TXT, JPEG, PNG, WEBP`));
    }
};
exports.uploadReferenceFiles = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit per file
        files: 5, // Maximum 5 files per request
    },
    fileFilter,
}).array('referenceFiles', 5);
exports.uploadSingleFinalDocument = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit for completed documents
    },
    fileFilter,
}).single('document');
const allowedAvatarMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
const avatarFileFilter = (_req, file, cb) => {
    if (allowedAvatarMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new apiError_js_1.ApiError(400, `Unsupported avatar image type: ${file.mimetype}. Allowed types: JPEG, PNG, WEBP`));
    }
};
exports.uploadProfileAvatar = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max for profile avatars
    },
    fileFilter: avatarFileFilter,
}).single('avatar');
//# sourceMappingURL=upload.middleware.js.map