"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const morgan_1 = __importDefault(require("morgan"));
const env_js_1 = __importDefault(require("./config/env.js"));
const rateLimiter_js_1 = require("./middlewares/rateLimiter.js");
const errorHandler_js_1 = require("./middlewares/errorHandler.js");
const apiError_js_1 = require("./utils/apiError.js");
const auth_routes_js_1 = __importDefault(require("./modules/auth/auth.routes.js"));
const request_routes_js_1 = __importDefault(require("./modules/requests/request.routes.js"));
const quotation_routes_js_1 = __importDefault(require("./modules/quotations/quotation.routes.js"));
const payment_routes_js_1 = __importDefault(require("./modules/payments/payment.routes.js"));
const chat_routes_js_1 = __importDefault(require("./modules/chat/chat.routes.js"));
const document_routes_js_1 = __importDefault(require("./modules/documents/document.routes.js"));
const admin_routes_js_1 = __importDefault(require("./modules/admin/admin.routes.js"));
const profile_routes_js_1 = __importDefault(require("./modules/profile/profile.routes.js"));
const createApp = (options = {}) => {
    const { unifiedFrontend = false } = options;
    const app = (0, express_1.default)();
    // Trust reverse proxy headers (Hostinger / LiteSpeed / Nginx) for accurate client IP & HTTPS detection
    app.set('trust proxy', 1);
    // 1. Security HTTP Headers
    app.use((0, helmet_1.default)({
        // Disable Helmet default CSP in unified mode so Next.js scripts, Razorpay & Cloudinary load cleanly
        contentSecurityPolicy: unifiedFrontend ? false : undefined,
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        crossOriginEmbedderPolicy: false,
    }));
    // 2. CORS configuration (also allows www.<domain> automatically when CLIENT_URL is set)
    const allowedOrigins = new Set([
        env_js_1.default.CLIENT_URL,
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
    ]);
    if (env_js_1.default.CLIENT_URL.startsWith('https://') && !env_js_1.default.CLIENT_URL.startsWith('https://www.')) {
        allowedOrigins.add(env_js_1.default.CLIENT_URL.replace('https://', 'https://www.'));
    }
    const corsMiddleware = (0, cors_1.default)({
        origin: (origin, callback) => {
            // Allow requests with no origin (same-origin server requests, mobile apps, curl, webhooks)
            if (!origin || allowedOrigins.has(origin)) {
                return callback(null, true);
            }
            return callback(new apiError_js_1.ApiError(403, `CORS blocked: Origin ${origin} is not allowed.`));
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    });
    if (unifiedFrontend) {
        app.use(env_js_1.default.API_PREFIX, corsMiddleware);
    }
    else {
        app.use(corsMiddleware);
    }
    // 3. Request Logging
    if (env_js_1.default.NODE_ENV !== 'test') {
        app.use(unifiedFrontend ? env_js_1.default.API_PREFIX : '/', (0, morgan_1.default)(env_js_1.default.NODE_ENV === 'production' ? 'combined' : 'dev'));
    }
    // 4. Rate Limiting (scoped to API routes in unified mode so Next.js static assets aren't throttled)
    if (unifiedFrontend) {
        app.use(env_js_1.default.API_PREFIX, rateLimiter_js_1.rateLimiter);
    }
    else {
        app.use(rateLimiter_js_1.rateLimiter);
    }
    // 5. Body Parsers & Cookie Parser (with rawBody capture for Webhook HMAC verification)
    const jsonParser = express_1.default.json({
        limit: '10mb',
        verify: (req, _res, buf) => {
            req.rawBody = buf;
        },
    });
    const urlencodedParser = express_1.default.urlencoded({ extended: true, limit: '10mb' });
    const cookies = (0, cookie_parser_1.default)();
    if (unifiedFrontend) {
        app.use(env_js_1.default.API_PREFIX, jsonParser, urlencodedParser, cookies);
    }
    else {
        app.use(jsonParser);
        app.use(urlencodedParser);
        app.use(cookies);
    }
    // 6. Health Check Endpoints
    app.get(['/health', `${env_js_1.default.API_PREFIX}/health`], (_req, res) => {
        res.status(200).json({
            status: 'healthy',
            mode: unifiedFrontend ? 'unified-single-domain' : 'standalone-api',
            timestamp: new Date().toISOString(),
            service: 'Document Service Backend API',
            version: '1.0.0',
        });
    });
    // 7. Mount Module Routes
    app.use(`${env_js_1.default.API_PREFIX}/auth`, auth_routes_js_1.default);
    app.use(`${env_js_1.default.API_PREFIX}/profile`, profile_routes_js_1.default);
    app.use(`${env_js_1.default.API_PREFIX}/requests`, request_routes_js_1.default);
    app.use(`${env_js_1.default.API_PREFIX}/quotations`, quotation_routes_js_1.default);
    app.use(`${env_js_1.default.API_PREFIX}/payments`, payment_routes_js_1.default);
    app.use(`${env_js_1.default.API_PREFIX}/chat`, chat_routes_js_1.default);
    app.use(`${env_js_1.default.API_PREFIX}/documents`, document_routes_js_1.default);
    app.use(`${env_js_1.default.API_PREFIX}/admin`, admin_routes_js_1.default);
    // 8. 404 Fallback & Centralized Error Handler
    if (unifiedFrontend) {
        app.use(env_js_1.default.API_PREFIX, (req, _res, next) => {
            next(new apiError_js_1.ApiError(404, `API route ${req.method} ${req.originalUrl} not found.`));
        });
        app.use(env_js_1.default.API_PREFIX, errorHandler_js_1.errorHandler);
    }
    else {
        app.use((req, _res, next) => {
            next(new apiError_js_1.ApiError(404, `Route ${req.method} ${req.originalUrl} not found.`));
        });
        app.use(errorHandler_js_1.errorHandler);
    }
    return app;
};
exports.createApp = createApp;
exports.default = exports.createApp;
//# sourceMappingURL=app.js.map