"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const quotation_controller_js_1 = __importDefault(require("./quotation.controller.js"));
const auth_middleware_js_1 = require("../../middlewares/auth.middleware.js");
const rbac_middleware_js_1 = require("../../middlewares/rbac.middleware.js");
const validate_middleware_js_1 = require("../../middlewares/validate.middleware.js");
const quotation_validation_js_1 = require("./quotation.validation.js");
const router = (0, express_1.Router)();
// All quotation routes require authentication
router.use(auth_middleware_js_1.authenticate);
// 1. Admin creates quotation
router.post('/', rbac_middleware_js_1.requireAdmin, (0, validate_middleware_js_1.validateRequest)({ body: quotation_validation_js_1.createQuotationSchema }), quotation_controller_js_1.default.create);
// 2. Get quotations for a specific request
router.get('/request/:requestId', quotation_controller_js_1.default.getByRequest);
// 3. User accepts quotation (generates 50% advance Razorpay order)
router.post('/:id/accept', quotation_controller_js_1.default.accept);
// 4. User rejects quotation
router.post('/:id/reject', (0, validate_middleware_js_1.validateRequest)({ body: quotation_validation_js_1.rejectQuotationSchema }), quotation_controller_js_1.default.reject);
exports.default = router;
//# sourceMappingURL=quotation.routes.js.map