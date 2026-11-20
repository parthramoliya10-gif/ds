"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chat_controller_js_1 = __importDefault(require("./chat.controller.js"));
const auth_middleware_js_1 = require("../../middlewares/auth.middleware.js");
const upload_middleware_js_1 = require("../../middlewares/upload.middleware.js");
const router = (0, express_1.Router)();
// All chat routes require authentication
router.use(auth_middleware_js_1.authenticate);
// 1. Fetch message history
router.get('/:requestId/messages', chat_controller_js_1.default.getMessages);
// 2. Post message with optional file upload via REST
router.post('/:requestId/messages', upload_middleware_js_1.uploadSingleFinalDocument, // Multer single file upload helper
chat_controller_js_1.default.postMessage);
// 3. Mark messages as read (Blue ticks)
router.patch('/:requestId/read', chat_controller_js_1.default.markRead);
// 4. Delete message (WhatsApp style: 'for_me' or 'for_everyone')
router.delete('/:requestId/messages/:messageId', chat_controller_js_1.default.deleteMessage);
exports.default = router;
//# sourceMappingURL=chat.routes.js.map