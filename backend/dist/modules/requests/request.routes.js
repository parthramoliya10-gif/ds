"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const request_controller_js_1 = __importDefault(require("./request.controller.js"));
const auth_middleware_js_1 = require("../../middlewares/auth.middleware.js");
const rbac_middleware_js_1 = require("../../middlewares/rbac.middleware.js");
const validate_middleware_js_1 = require("../../middlewares/validate.middleware.js");
const upload_middleware_js_1 = require("../../middlewares/upload.middleware.js");
const request_validation_js_1 = require("./request.validation.js");
const router = (0, express_1.Router)();
// All request routes require authentication
router.use(auth_middleware_js_1.authenticate);
// 1. Submit new document request with optional reference files (up to 5 files, max 10MB each)
router.post('/', upload_middleware_js_1.uploadReferenceFiles, (0, validate_middleware_js_1.validateRequest)({ body: request_validation_js_1.createRequestSchema }), request_controller_js_1.default.create);
// 2. List requests (User gets their own, Admin gets all with search/status filters)
router.get('/', request_controller_js_1.default.list);
// 3. Get single request detail (strict IDOR ownership check)
router.get('/:id', request_controller_js_1.default.getById);
// 4. Admin updates request status
router.patch('/:id/status', rbac_middleware_js_1.requireAdmin, (0, validate_middleware_js_1.validateRequest)({ body: request_validation_js_1.updateRequestStatusSchema }), request_controller_js_1.default.updateStatus);
// 5. User cancels their own PENDING request
router.delete('/:id', request_controller_js_1.default.cancel);
exports.default = router;
//# sourceMappingURL=request.routes.js.map