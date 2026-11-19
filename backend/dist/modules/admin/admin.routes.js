"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_js_1 = __importDefault(require("./admin.controller.js"));
const auth_middleware_js_1 = require("../../middlewares/auth.middleware.js");
const rbac_middleware_js_1 = require("../../middlewares/rbac.middleware.js");
const router = (0, express_1.Router)();
// Strict security: All admin routes require authentication AND Admin role
router.use(auth_middleware_js_1.authenticate);
router.use(rbac_middleware_js_1.requireAdmin);
// 1. Dashboard metrics & financial overview
router.get('/dashboard/stats', admin_controller_js_1.default.getDashboardStats);
// 2. Security & activity audit logs
router.get('/audit-logs', admin_controller_js_1.default.getAuditLogs);
exports.default = router;
//# sourceMappingURL=admin.routes.js.map