"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentController = exports.PaymentController = void 0;
const payment_service_js_1 = __importDefault(require("./payment.service.js"));
const apiResponse_js_1 = require("../../utils/apiResponse.js");
const apiError_js_1 = require("../../utils/apiError.js");
class PaymentController {
    /**
     * POST /api/v1/payments/create-order
     * Create Razorpay order for ADVANCE_50 or FINAL_50
     */
    async createOrder(req, res, next) {
        try {
            if (!req.user) {
                throw new apiError_js_1.ApiError(401, 'Unauthorized');
            }
            const { requestId, milestone } = req.body;
            const order = await payment_service_js_1.default.createPaymentOrder(req.user.id, requestId, milestone);
            (0, apiResponse_js_1.sendResponse)({
                res,
                statusCode: 201,
                message: 'Razorpay order created successfully',
                data: order,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/v1/payments/verify
     * Client-side checkout callback verification
     */
    async verify(req, res, next) {
        try {
            if (!req.user) {
                throw new apiError_js_1.ApiError(401, 'Unauthorized');
            }
            const result = await payment_service_js_1.default.verifyPayment(req.user.id, req.body);
            (0, apiResponse_js_1.sendResponse)({
                res,
                statusCode: 200,
                message: 'Payment verified successfully! Milestone updated.',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/v1/payments/complete
     * Record or finalize milestone payment (for verified checkout & sandbox simulation)
     */
    async completePayment(req, res, next) {
        try {
            if (!req.user) {
                throw new apiError_js_1.ApiError(401, 'Unauthorized');
            }
            const { requestId, milestone, transactionId } = req.body;
            const result = await payment_service_js_1.default.completeMilestonePayment(req.user.id, requestId, milestone, transactionId);
            (0, apiResponse_js_1.sendResponse)({
                res,
                statusCode: 200,
                message: 'Payment recorded successfully! Download unlocked.',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/v1/payments/webhook
     * Server-to-Server Razorpay Webhook receiver
     */
    async webhook(req, res, next) {
        try {
            const signature = req.headers['x-razorpay-signature'];
            const rawBody = req.rawBody || JSON.stringify(req.body);
            const result = await payment_service_js_1.default.processWebhook(rawBody, signature);
            res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/v1/payments/my-history
     * Get logged-in user's payment records
     */
    async myHistory(req, res, next) {
        try {
            if (!req.user) {
                throw new apiError_js_1.ApiError(401, 'Unauthorized');
            }
            const history = await payment_service_js_1.default.getUserPayments(req.user.id);
            (0, apiResponse_js_1.sendResponse)({
                res,
                statusCode: 200,
                message: 'Payment history retrieved successfully',
                data: history,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/v1/payments/admin/all
     * Admin-only: View all payments and revenue
     */
    async adminList(req, res, next) {
        try {
            if (!req.user) {
                throw new apiError_js_1.ApiError(401, 'Unauthorized');
            }
            const payments = await payment_service_js_1.default.getAllPaymentsForAdmin();
            (0, apiResponse_js_1.sendResponse)({
                res,
                statusCode: 200,
                message: 'All payments retrieved successfully',
                data: payments,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.PaymentController = PaymentController;
exports.paymentController = new PaymentController();
exports.default = exports.paymentController;
//# sourceMappingURL=payment.controller.js.map