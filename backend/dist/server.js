"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const app_js_1 = require("./app.js");
const env_js_1 = __importDefault(require("./config/env.js"));
const logger_js_1 = __importDefault(require("./utils/logger.js"));
const prisma_js_1 = __importDefault(require("./config/prisma.js"));
const socket_server_js_1 = require("./sockets/socket.server.js");
const app = (0, app_js_1.createApp)();
const server = http_1.default.createServer({ maxHeaderSize: 1048576 }, app);
// Initialize Socket.IO Server with real-time WhatsApp-style chat engine
const io = (0, socket_server_js_1.initSocketServer)(server);
const startServer = async (retries = 3, delayMs = 3000) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            logger_js_1.default.info(`🔄 Connecting to database (Attempt ${attempt}/${retries})...`);
            await prisma_js_1.default.$connect();
            logger_js_1.default.info('🐘 PostgreSQL Database successfully connected via Prisma');
            break;
        }
        catch (error) {
            if (attempt === retries) {
                logger_js_1.default.error('❌ Failed to connect to database after maximum retries:', error);
                process.exit(1);
            }
            logger_js_1.default.warn(`⚠️ Database connection attempt ${attempt} failed (${error.message}). Retrying in ${delayMs / 1000}s...`);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
    }
    server.listen(env_js_1.default.PORT, () => {
        logger_js_1.default.info(`🚀 Document Service Management Backend running on port ${env_js_1.default.PORT}`);
        logger_js_1.default.info(`📡 API endpoint: http://localhost:${env_js_1.default.PORT}${env_js_1.default.API_PREFIX}`);
        logger_js_1.default.info(`🛡️ Environment: ${env_js_1.default.NODE_ENV}`);
    });
};
// Handle unhandled rejections and exceptions
process.on('unhandledRejection', (reason) => {
    logger_js_1.default.error('UNHANDLED REJECTION! 💥 Shutting down...', reason);
    process.exit(1);
});
process.on('uncaughtException', (error) => {
    logger_js_1.default.error('UNCAUGHT EXCEPTION! 💥 Shutting down...', error);
    process.exit(1);
});
// Graceful shutdown
process.on('SIGTERM', async () => {
    logger_js_1.default.info('👋 SIGTERM received. Closing HTTP server and DB connections...');
    server.close(async () => {
        await prisma_js_1.default.$disconnect();
        logger_js_1.default.info('💤 Process terminated gracefully.');
    });
});
startServer();
//# sourceMappingURL=server.js.map