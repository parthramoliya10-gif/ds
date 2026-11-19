"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.razorpay = void 0;
const razorpay_1 = __importDefault(require("razorpay"));
const env_js_1 = __importDefault(require("./env.js"));
exports.razorpay = new razorpay_1.default({
    key_id: env_js_1.default.RAZORPAY_KEY_ID || 'dummy_key_id',
    key_secret: env_js_1.default.RAZORPAY_KEY_SECRET || 'dummy_key_secret',
});
exports.default = exports.razorpay;
//# sourceMappingURL=razorpay.js.map