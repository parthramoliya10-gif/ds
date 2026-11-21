import { AuthenticatedUser } from '../../types/express.js';
export interface UploadDocumentInput {
    title: string;
}
export declare class DocumentService {
    /**
     * Admin-only: Upload final completed document to Private/Authenticated storage
     */
    uploadFinalDocument(adminId: string, requestId: string, file: Express.Multer.File, data: UploadDocumentInput): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        requestId: string;
        uploadedByAdminId: string;
        title: string;
        fileName: string;
        cloudinaryPublicId: string;
        secureUrl: string;
        fileSize: number;
        mimeType: string;
        version: number;
        downloadCount: number;
    }>;
    /**
     * Get all uploaded final document versions for a request
     */
    getDocumentsForRequest(requestId: string, user: AuthenticatedUser): Promise<{
        requestId: string;
        isDownloadUnlocked: boolean;
        requestStatus: import(".prisma/client").$Enums.RequestStatus;
        documents: {
            id: string;
            createdAt: Date;
            title: string;
            fileName: string;
            cloudinaryPublicId: string;
            secureUrl: string;
            fileSize: number;
            mimeType: string;
            version: number;
            downloadCount: number;
        }[];
    }>;
    /**
     * THE SECURE GATEKEEPER:
     * Only allows generating a time-limited signed download URL IF 100% payments are verified!
     */
    downloadDocument(documentId: string, user: AuthenticatedUser, meta?: {
        ipAddress?: string;
        userAgent?: string;
    }): Promise<{
        downloadUrl: string;
        fileName: string;
        mimeType: string;
        fileSize: number;
        expiresInSeconds: number;
    }>;
    /**
     * Admin-only: Delete final document version
     */
    deleteFinalDocument(documentId: string, adminId: string): Promise<{
        success: boolean;
    }>;
}
export declare const documentService: DocumentService;
export default documentService;
