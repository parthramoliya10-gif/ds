"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.quotationController = exports.QuotationController = void 0;
const quotation_service_js_1 = __importDefault(require("./quotation.service.js"));
const apiResponse_js_1 = require("../../utils/apiResponse.js");
const apiError_js_1 = require("../../utils/apiError.js");
class QuotationController {
    /**
     * POST /api/v1/quotations
     * Admin-only: Create and send quotation
     */
    async create(req, res, next) {
        try {
            if (!req.user) {
                throw new apiError_js_1.ApiError(401, 'Unauthorized');
            }
            const quotation = await quotation_service_js_1.default.createQuotation(req.user.id, req.body);
            (0, apiResponse_js_1.sendResponse)({
                res,
                statusCode: 201,
                message: 'Quotation created and posted to chat successfully',
                data: quotation,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/v1/quotations/request/:requestId
     * Get all quotation versions for request
     */
    async getByRequest(req, res, next) {
        try {
            if (!req.user) {
                throw new apiError_js_1.ApiError(401, 'Unauthorized');
            }
            const requestId = req.params.requestId;
            const quotations = await quotation_service_js_1.default.getQuotationsForRequest(requestId, req.user);
            (0, apiResponse_js_1.sendResponse)({
                res,
                statusCode: 200,
                message: 'Quotations retrieved successfully',
                data: quotations,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/v1/quotations/:id/accept
     * User accepts quotation & generates 50% advance Razorpay order
     */
    async accept(req, res, next) {
        try {
            if (!req.user) {
                throw new apiError_js_1.ApiError(401, 'Unauthorized');
            }
            const quotationId = req.params.id;
            const result = await quotation_service_js_1.default.acceptQuotation(req.user.id, quotationId);
            (0, apiResponse_js_1.sendResponse)({
                res,
                statusCode: 200,
                message: 'Quotation accepted! Advance 50% payment order created.',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/v1/quotations/:id/reject
     * User rejects quotation
     */
    async reject(req, res, next) {
        try {
            if (!req.user) {
                throw new apiError_js_1.ApiError(401, 'Unauthorized');
            }
            const quotationId = req.params.id;
            const { reason } = req.body;
            const result = await quotation_service_js_1.default.rejectQuotation(req.user.id, quotationId, reason);
            (0, apiResponse_js_1.sendResponse)({
                res,
                statusCode: 200,
                message: 'Quotation rejected.',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.QuotationController = QuotationController;
exports.quotationController = new QuotationController();
exports.default = exports.quotationController;
//# sourceMappingURL=quotation.controller.js.map