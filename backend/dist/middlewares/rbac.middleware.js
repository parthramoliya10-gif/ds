"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireUser = exports.requireAdmin = exports.requireRole = void 0;
const client_1 = require("@prisma/client");
const apiError_js_1 = require("../utils/apiError.js");
const requireRole = (...allowedRoles) => {
    return (req, _res, next) => {
        if (!req.user) {
            return next(new apiError_js_1.ApiError(401, 'Unauthorized: Please log in.'));
        }
        if (!allowedRoles.includes(req.user.role)) {
            return next(new apiError_js_1.ApiError(403, `Forbidden: Access denied. Required role: [${allowedRoles.join(', ')}], your role: [${req.user.role}]`));
        }
        next();
    };
};
exports.requireRole = requireRole;
exports.requireAdmin = (0, exports.requireRole)(client_1.Role.ADMIN);
exports.requireUser = (0, exports.requireRole)(client_1.Role.USER);
//# sourceMappingURL=rbac.middleware.js.map