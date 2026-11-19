"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminController = exports.AdminController = void 0;
const admin_service_js_1 = __importDefault(require("./admin.service.js"));
const apiResponse_js_1 = require("../../utils/apiResponse.js");
const apiError_js_1 = require("../../utils/apiError.js");
class AdminController {
    /**
     * GET /api/v1/admin/dashboard/stats
     * Global analytics for Admin dashboard
     */
    async getDashboardStats(req, res, next) {
        try {
            if (!req.user) {
                throw new apiError_js_1.ApiError(401, 'Unauthorized');
            }
            const stats = await admin_service_js_1.default.getDashboardStats();
            (0, apiResponse_js_1.sendResponse)({
                res,
                statusCode: 200,
                message: 'Admin dashboard statistics retrieved successfully',
                data: stats,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/v1/admin/audit-logs
     * View security audit trail
     */
    async getAuditLogs(req, res, next) {
        try {
            if (!req.user) {
                throw new apiError_js_1.ApiError(401, 'Unauthorized');
            }
            const query = {
                page: req.query.page ? parseInt(req.query.page, 10) : 1,
                limit: req.query.limit ? parseInt(req.query.limit, 10) : 20,
                action: req.query.action,
                actorId: req.query.actorId,
            };
            const result = await admin_service_js_1.default.getAuditLogs(query);
            (0, apiResponse_js_1.sendResponse)({
                res,
                statusCode: 200,
                message: 'Audit logs retrieved successfully',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AdminController = AdminController;
exports.adminController = new AdminController();
exports.default = exports.adminController;
//# sourceMappingURL=admin.controller.js.map