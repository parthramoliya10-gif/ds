"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const document_controller_js_1 = __importDefault(require("./document.controller.js"));
const auth_middleware_js_1 = require("../../middlewares/auth.middleware.js");
const rbac_middleware_js_1 = require("../../middlewares/rbac.middleware.js");
const upload_middleware_js_1 = require("../../middlewares/upload.middleware.js");
const validate_middleware_js_1 = require("../../middlewares/validate.middleware.js");
const document_validation_js_1 = require("./document.validation.js");
const router = (0, express_1.Router)();
// All document routes require authentication
router.use(auth_middleware_js_1.authenticate);
// 1. Admin uploads completed final document
router.post('/:requestId/upload', rbac_middleware_js_1.requireAdmin, upload_middleware_js_1.uploadSingleFinalDocument, (0, validate_middleware_js_1.validateRequest)({ body: document_validation_js_1.uploadFinalDocumentSchema }), document_controller_js_1.default.upload);
// 2. Get document records for request (with download lock status)
router.get('/request/:requestId', document_controller_js_1.default.getByRequest);
// 3. SECURE GATEKEEPER: Download completed document (unlocked ONLY after 100% payment)
router.get('/:documentId/download', document_controller_js_1.default.download);
exports.default = router;
//# sourceMappingURL=document.routes.js.map