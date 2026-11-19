import { Request, Response, NextFunction } from 'express';
export declare class DocumentController {
    /**
     * POST /api/v1/documents/:requestId/upload
     * Admin-only: Upload final completed document
     */
    upload(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/documents/request/:requestId
     * Get documents list for request with lock status
     */
    getByRequest(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/documents/:documentId/download
     * Secure Gatekeeper: Generate signed download URL (strictly locked until 100% payment)
     */
    download(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const documentController: DocumentController;
export default documentController;
