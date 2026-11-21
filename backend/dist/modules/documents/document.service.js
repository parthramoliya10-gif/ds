"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentService = exports.DocumentService = void 0;
const client_1 = require("@prisma/client");
const prisma_js_1 = __importDefault(require("../../config/prisma.js"));
const apiError_js_1 = require("../../utils/apiError.js");
const cloudinary_js_1 = require("../../utils/cloudinary.js");
const socket_server_js_1 = require("../../sockets/socket.server.js");
const socketEvents_js_1 = __importDefault(require("../../constants/socketEvents.js"));
const logger_js_1 = __importDefault(require("../../utils/logger.js"));
class DocumentService {
    /**
     * Admin-only: Upload final completed document to Private/Authenticated storage
     */
    async uploadFinalDocument(adminId, requestId, file, data) {
        // 1. Verify request exists
        const request = await prisma_js_1.default.documentRequest.findUnique({
            where: { id: requestId },
            include: { conversation: true },
        });
        if (!request) {
            throw new apiError_js_1.ApiError(404, 'Document request not found.');
        }
        // 2. Upload file to Cloudinary authenticated storage (private access)
        let uploadRes;
        try {
            uploadRes = await (0, cloudinary_js_1.uploadBufferToCloudinary)(file.buffer, 'document-system/final-documents', {
                resourceType: 'auto',
                isPrivate: true,
            });
        }
        catch (uploadErr) {
            logger_js_1.default.error('Error uploading final document to Cloudinary:', uploadErr);
            throw new apiError_js_1.ApiError(500, `Failed to upload completed document: ${uploadErr.message}`);
        }
        // 3. Calculate document version
        const previousVersionsCount = await prisma_js_1.default.finalDocument.count({
            where: { requestId },
        });
        const version = previousVersionsCount + 1;
        // 4. Atomic Transaction: Save Document record, Update Request status, Inject Chat notification
        const finalDoc = await prisma_js_1.default.$transaction(async (tx) => {
            const document = await tx.finalDocument.create({
                data: {
                    requestId,
                    uploadedByAdminId: adminId,
                    title: data.title,
                    fileName: file.originalname,
                    cloudinaryPublicId: uploadRes.publicId,
                    secureUrl: uploadRes.secureUrl,
                    fileSize: file.size,
                    mimeType: file.mimetype,
                    version,
                    downloadCount: 0,
                },
            });
            // Update Request status to DOCUMENT_UPLOADED
            await tx.documentRequest.update({
                where: { id: requestId },
                data: {
                    status: client_1.RequestStatus.DOCUMENT_UPLOADED,
                },
            });
            // Inject system message in chat
            let systemMessage = null;
            if (request.conversation) {
                systemMessage = await tx.message.create({
                    data: {
                        conversationId: request.conversation.id,
                        senderId: adminId,
                        senderRole: client_1.Role.ADMIN,
                        adminSenderId: adminId,
                        messageType: client_1.MessageType.SYSTEM,
                        content: `📄 Admin has uploaded the completed document "${data.title}" (v${version})! Please pay the remaining 50% milestone balance to unlock your download.`,
                        metadata: {
                            documentId: document.id,
                            version: document.version,
                            title: document.title,
                            fileName: document.fileName,
                            isDownloadUnlocked: request.isDownloadUnlocked,
                        },
                    },
                });
            }
            // Record Audit Log
            await tx.auditLog.create({
                data: {
                    actorId: adminId,
                    actorRole: client_1.Role.ADMIN,
                    adminActorId: adminId,
                    requestId,
                    action: 'FINAL_DOCUMENT_UPLOADED',
                    metadata: {
                        documentId: document.id,
                        version,
                        fileName: file.originalname,
                    },
                },
            });
            return { document, systemMessage };
        }, {
            maxWait: 15000,
            timeout: 20000,
        });
        if (finalDoc.systemMessage) {
            (0, socket_server_js_1.emitToRequestRoom)(requestId, socketEvents_js_1.default.NEW_MESSAGE, finalDoc.systemMessage);
        }
        return finalDoc.document;
    }
    /**
     * Get all uploaded final document versions for a request
     */
    async getDocumentsForRequest(requestId, user) {
        const request = await prisma_js_1.default.documentRequest.findUnique({
            where: { id: requestId },
            select: {
                id: true,
                userId: true,
                isDownloadUnlocked: true,
                status: true,
            },
        });
        if (!request) {
            throw new apiError_js_1.ApiError(404, 'Document request not found.');
        }
        if (user.role !== client_1.Role.ADMIN && request.userId !== user.id) {
            throw new apiError_js_1.ApiError(403, 'Forbidden: You do not have permission to view documents for this request.');
        }
        const documents = await prisma_js_1.default.finalDocument.findMany({
            where: { requestId },
            orderBy: { version: 'desc' },
            select: {
                id: true,
                title: true,
                fileName: true,
                fileSize: true,
                mimeType: true,
                version: true,
                downloadCount: true,
                createdAt: true,
                // Cloudinary internal URLs and public IDs are masked unless user is Admin
                secureUrl: user.role === client_1.Role.ADMIN,
                cloudinaryPublicId: user.role === client_1.Role.ADMIN,
            },
        });
        return {
            requestId: request.id,
            isDownloadUnlocked: request.isDownloadUnlocked,
            requestStatus: request.status,
            documents,
        };
    }
    /**
     * THE SECURE GATEKEEPER:
     * Only allows generating a time-limited signed download URL IF 100% payments are verified!
     */
    async downloadDocument(documentId, user, meta = {}) {
        // 1. Fetch document with request and payment details
        const document = await prisma_js_1.default.finalDocument.findUnique({
            where: { id: documentId },
            include: {
                request: {
                    include: {
                        payments: {
                            where: { status: 'SUCCESS' },
                        },
                    },
                },
            },
        });
        if (!document) {
            throw new apiError_js_1.ApiError(404, 'Requested document not found.');
        }
        // 2. Strict IDOR Check: Non-admin users cannot access files of another user
        if (user.role !== client_1.Role.ADMIN && document.request.userId !== user.id) {
            logger_js_1.default.warn(`Unauthorized download attempt: User ${user.id} tried to download document ${documentId}`);
            throw new apiError_js_1.ApiError(403, 'Forbidden: You do not have authorization to download this document.');
        }
        // 3. CRITICAL PAYMENT GATEKEEPER:
        // If not Admin, check if download is unlocked (Both Advance 50% and Final 50% paid)
        if (user.role !== client_1.Role.ADMIN && !document.request.isDownloadUnlocked) {
            logger_js_1.default.warn(`Blocked download attempt: User ${user.id} attempted to download before completing final payment.`);
            throw new apiError_js_1.ApiError(403, 'Payment Required: Please complete the remaining 50% milestone payment to unlock and download this document.');
        }
        // 4. Generate Short-Lived Signed Download URL (Expires in 120 seconds / 2 minutes)
        const fileExtension = document.fileName.split('.').pop()?.toLowerCase() || 'pdf';
        const isImageOrPdf = document.mimeType.startsWith('image/') || document.mimeType === 'application/pdf';
        const signedDownloadUrl = (0, cloudinary_js_1.generateSignedDownloadUrl)(document.cloudinaryPublicId, fileExtension, 120, {
            resourceType: isImageOrPdf ? 'image' : 'raw',
            type: 'authenticated',
        });
        // 5. Increment download counter & record audit log
        await prisma_js_1.default.$transaction([
            prisma_js_1.default.finalDocument.update({
                where: { id: documentId },
                data: { downloadCount: { increment: 1 } },
            }),
            prisma_js_1.default.auditLog.create({
                data: {
                    actorId: user.id,
                    actorRole: user.role,
                    ...(user.role === client_1.Role.ADMIN
                        ? { adminActorId: user.id }
                        : { userActorId: user.id }),
                    requestId: document.requestId,
                    action: 'FINAL_DOCUMENT_DOWNLOADED',
                    ipAddress: meta.ipAddress,
                    userAgent: meta.userAgent,
                    metadata: {
                        documentId,
                        version: document.version,
                        fileName: document.fileName,
                    },
                },
            }),
        ]);
        return {
            downloadUrl: signedDownloadUrl,
            fileName: document.fileName,
            mimeType: document.mimeType,
            fileSize: document.fileSize,
            expiresInSeconds: 120,
        };
    }
    /**
     * Admin-only: Delete final document version
     */
    async deleteFinalDocument(documentId, adminId) {
        const document = await prisma_js_1.default.finalDocument.findUnique({
            where: { id: documentId },
        });
        if (!document) {
            throw new apiError_js_1.ApiError(404, 'Document record not found.');
        }
        await prisma_js_1.default.finalDocument.delete({
            where: { id: documentId },
        });
        return { success: true };
    }
}
exports.DocumentService = DocumentService;
exports.documentService = new DocumentService();
exports.default = exports.documentService;
//# sourceMappingURL=document.service.js.map