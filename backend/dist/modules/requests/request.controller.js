"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestController = exports.RequestController = void 0;
const request_service_js_1 = __importDefault(require("./request.service.js"));
const apiResponse_js_1 = require("../../utils/apiResponse.js");
const apiError_js_1 = require("../../utils/apiError.js");
const client_1 = require("@prisma/client");
class RequestController {
    /**
     * POST /api/v1/requests
     * Create new document request with multipart reference files
     */
    async create(req, res, next) {
        try {
            if (!req.user) {
                throw new apiError_js_1.ApiError(401, 'Unauthorized');
            }
            const files = req.files;
            const request = await request_service_js_1.default.createRequest(req.user.id, req.body, files);
            (0, apiResponse_js_1.sendResponse)({
                res,
                statusCode: 201,
                message: 'Document request submitted successfully',
                data: request,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/v1/requests
     * User sees own requests, Admin sees all
     */
    async list(req, res, next) {
        try {
            if (!req.user) {
                throw new apiError_js_1.ApiError(401, 'Unauthorized');
            }
            const query = {
                page: req.query.page ? parseInt(req.query.page, 10) : 1,
                limit: req.query.limit ? parseInt(req.query.limit, 10) : 10,
                status: req.query.status,
                search: req.query.search,
            };
            if (req.user.role === client_1.Role.ADMIN) {
                const result = await request_service_js_1.default.getAllRequestsForAdmin(query);
                (0, apiResponse_js_1.sendResponse)({
                    res,
                    statusCode: 200,
                    message: 'Admin requests retrieved successfully',
                    data: result,
                });
            }
            else {
                const result = await request_service_js_1.default.getUserRequests(req.user.id, query);
                (0, apiResponse_js_1.sendResponse)({
                    res,
                    statusCode: 200,
                    message: 'User requests retrieved successfully',
                    data: result,
                });
            }
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/v1/requests/:id
     * Get single request details with authorization guard
     */
    async getById(req, res, next) {
        try {
            if (!req.user) {
                throw new apiError_js_1.ApiError(401, 'Unauthorized');
            }
            const requestId = req.params.id;
            const request = await request_service_js_1.default.getRequestById(requestId, req.user);
            (0, apiResponse_js_1.sendResponse)({
                res,
                statusCode: 200,
                message: 'Request details retrieved successfully',
                data: request,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * PATCH /api/v1/requests/:id/status
     * Admin-only: Update request status
     */
    async updateStatus(req, res, next) {
        try {
            if (!req.user) {
                throw new apiError_js_1.ApiError(401, 'Unauthorized');
            }
            const requestId = req.params.id;
            const { status } = req.body;
            const updated = await request_service_js_1.default.updateStatus(req.user.id, requestId, status);
            (0, apiResponse_js_1.sendResponse)({
                res,
                statusCode: 200,
                message: `Request status updated to ${status}`,
                data: updated,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * DELETE /api/v1/requests/:id
     * User can cancel their own PENDING request
     */
    async cancel(req, res, next) {
        try {
            if (!req.user) {
                throw new apiError_js_1.ApiError(401, 'Unauthorized');
            }
            const requestId = req.params.id;
            const cancelled = await request_service_js_1.default.cancelRequest(req.user.id, requestId);
            (0, apiResponse_js_1.sendResponse)({
                res,
                statusCode: 200,
                message: 'Request cancelled successfully',
                data: cancelled,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.RequestController = RequestController;
exports.requestController = new RequestController();
exports.default = exports.requestController;
//# sourceMappingURL=request.controller.js.map