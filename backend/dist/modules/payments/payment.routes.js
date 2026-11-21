"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_controller_js_1 = __importDefault(require("./payment.controller.js"));
const auth_middleware_js_1 = require("../../middlewares/auth.middleware.js");
const rbac_middleware_js_1 = require("../../middlewares/rbac.middleware.js");
const validate_middleware_js_1 = require("../../middlewares/validate.middleware.js");
const payment_validation_js_1 = require("./payment.validation.js");
const router = (0, express_1.Router)();
// 1. Webhook endpoint (Public, verified via x-razorpay-signature header)
router.post('/webhook', payment_controller_js_1.default.webhook);
// Protected routes below
router.use(auth_middleware_js_1.authenticate);
// 2. Create Razorpay order for ADVANCE_50 or FINAL_50
router.post('/create-order', (0, validate_middleware_js_1.validateRequest)({ body: payment_validation_js_1.createOrderSchema }), payment_controller_js_1.default.createOrder);
// 3. Verify payment signature after checkout
router.post('/verify', (0, validate_middleware_js_1.validateRequest)({ body: payment_validation_js_1.verifyPaymentSchema }), payment_controller_js_1.default.verify);
// 4. Record or complete milestone payment (for verified checkout & sandbox simulation)
router.post('/complete', payment_controller_js_1.default.completePayment);
// 5. User's own payment history
router.get('/my-history', payment_controller_js_1.default.myHistory);
// 6. Admin global payments list
router.get('/admin/all', rbac_middleware_js_1.requireAdmin, payment_controller_js_1.default.adminList);
exports.default = router;
//# sourceMappingURL=payment.routes.js.map