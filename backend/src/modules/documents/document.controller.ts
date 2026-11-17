import { Request, Response, NextFunction } from 'express';
import documentService from './document.service.js';
import { sendResponse } from '../../utils/apiResponse.js';
import { ApiError } from '../../utils/apiError.js';

export class DocumentController {
  /**
   * POST /api/v1/documents/:requestId/upload
   * Admin-only: Upload final completed document
   */
  async upload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Unauthorized');
      }

      const requestId = req.params.requestId as string;
      const file = req.file;

      if (!file) {
        throw new ApiError(400, 'Please select a document file to upload.');
      }

      const document = await documentService.uploadFinalDocument(
        req.user.id,
        requestId,
        file,
        req.body
      );

      sendResponse({
        res,
        statusCode: 201,
        message: 'Completed document uploaded successfully. Awaiting final payment.',
        data: document,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/documents/request/:requestId
   * Get documents list for request with lock status
   */
  async getByRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Unauthorized');
      }

      const requestId = req.params.requestId as string;
      const result = await documentService.getDocumentsForRequest(requestId, req.user);

      sendResponse({
        res,
        statusCode: 200,
        message: 'Documents retrieved successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/documents/:documentId/download
   * Secure Gatekeeper: Generate signed download URL (strictly locked until 100% payment)
   */
  async download(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Unauthorized');
      }

      const documentId = req.params.documentId as string;
      const clientIp =
        (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
        req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const downloadResult = await documentService.downloadDocument(
        documentId,
        req.user,
        { ipAddress: clientIp, userAgent }
      );

      sendResponse({
        res,
        statusCode: 200,
        message: 'Signed download link generated successfully (valid for 120 seconds)',
        data: downloadResult,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const documentController = new DocumentController();
export default documentController;
