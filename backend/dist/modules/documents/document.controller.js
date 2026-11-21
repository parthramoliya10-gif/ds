"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentController = exports.DocumentController = void 0;
const document_service_js_1 = __importDefault(require("./document.service.js"));
const apiResponse_js_1 = require("../../utils/apiResponse.js");
const apiError_js_1 = require("../../utils/apiError.js");
class DocumentController {
    /**
     * POST /api/v1/documents/:requestId/upload
     * Admin-only: Upload final completed document
     */
    async upload(req, res, next) {
        try {
            if (!req.user) {
                throw new apiError_js_1.ApiError(401, 'Unauthorized');
            }
            const requestId = req.params.requestId;
            const file = req.file;
            if (!file) {
                throw new apiError_js_1.ApiError(400, 'Please select a document file to upload.');
            }
            const document = await document_service_js_1.default.uploadFinalDocument(req.user.id, requestId, file, req.body);
            (0, apiResponse_js_1.sendResponse)({
                res,
                statusCode: 201,
                message: 'Completed document uploaded successfully. Awaiting final payment.',
                data: document,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/v1/documents/request/:requestId
     * Get documents list for request with lock status
     */
    async getByRequest(req, res, next) {
        try {
            if (!req.user) {
                throw new apiError_js_1.ApiError(401, 'Unauthorized');
            }
            const requestId = req.params.requestId;
            const result = await document_service_js_1.default.getDocumentsForRequest(requestId, req.user);
            (0, apiResponse_js_1.sendResponse)({
                res,
                statusCode: 200,
                message: 'Documents retrieved successfully',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/v1/documents/:documentId/download
     * Secure Gatekeeper: Generate signed download URL (strictly locked until 100% payment)
     */
    async download(req, res, next) {
        try {
            if (!req.user) {
                throw new apiError_js_1.ApiError(401, 'Unauthorized');
            }
            const documentId = req.params.documentId;
            const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() ||
                req.socket.remoteAddress;
            const userAgent = req.headers['user-agent'];
            const downloadResult = await document_service_js_1.default.downloadDocument(documentId, req.user, { ipAddress: clientIp, userAgent });
            (0, apiResponse_js_1.sendResponse)({
                res,
                statusCode: 200,
                message: 'Signed download link generated successfully (valid for 120 seconds)',
                data: downloadResult,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * DELETE /api/v1/documents/:documentId
     * Admin-only: Delete final document version
     */
    async delete(req, res, next) {
        try {
            if (!req.user) {
                throw new apiError_js_1.ApiError(401, 'Unauthorized');
            }
            const documentId = req.params.documentId;
            await document_service_js_1.default.deleteFinalDocument(documentId, req.user.id);
            (0, apiResponse_js_1.sendResponse)({
                res,
                statusCode: 200,
                message: 'Final document version deleted successfully',
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.DocumentController = DocumentController;
exports.documentController = new DocumentController();
exports.default = exports.documentController;
//# sourceMappingURL=document.controller.js.map