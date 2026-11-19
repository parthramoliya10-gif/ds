"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabaseClient = exports.supabaseAdmin = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const env_js_1 = __importDefault(require("./env.js"));
exports.supabaseAdmin = (0, supabase_js_1.createClient)(env_js_1.default.SUPABASE_URL, env_js_1.default.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});
exports.supabaseClient = (0, supabase_js_1.createClient)(env_js_1.default.SUPABASE_URL, env_js_1.default.SUPABASE_ANON_KEY);
exports.default = exports.supabaseAdmin;
//# sourceMappingURL=supabase.js.map