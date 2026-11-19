"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendResponse = void 0;
const sendResponse = ({ res, statusCode = 200, message = 'Success', data, }) => {
    return res.status(statusCode).json({
        success: true,
        statusCode,
        message,
        data: data !== undefined ? data : null,
    });
};
exports.sendResponse = sendResponse;
//# sourceMappingURL=apiResponse.js.map