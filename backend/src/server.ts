import http from 'http';
import { createApp } from './app.js';
import env from './config/env.js';
import logger from './utils/logger.js';
import prisma from './config/prisma.js';
import { initSocketServer } from './sockets/socket.server.js';

const app = createApp();
const server = http.createServer({ maxHeaderSize: 1048576 }, app);

// Initialize Socket.IO Server with real-time WhatsApp-style chat engine
const io = initSocketServer(server);

const startServer = async (retries = 3, delayMs = 3000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      logger.info(`🔄 Connecting to database (Attempt ${attempt}/${retries})...`);
      await prisma.$connect();
      logger.info('🐘 PostgreSQL Database successfully connected via Prisma');
      break;
    } catch (error: any) {
      if (attempt === retries) {
        logger.error('❌ Failed to connect to database after maximum retries:', error);
        process.exit(1);
      }
      logger.warn(`⚠️ Database connection attempt ${attempt} failed (${error.message}). Retrying in ${delayMs / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  server.listen(env.PORT, () => {
    logger.info(`🚀 Document Service Management Backend running on port ${env.PORT}`);
    logger.info(`📡 API endpoint: http://localhost:${env.PORT}${env.API_PREFIX}`);
    logger.info(`🛡️ Environment: ${env.NODE_ENV}`);
  });
};

// Handle unhandled rejections and exceptions
process.on('unhandledRejection', (reason: Error) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...', reason);
  process.exit(1);
});

process.on('uncaughtException', (error: Error) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('👋 SIGTERM received. Closing HTTP server and DB connections...');
  server.close(async () => {
    await prisma.$disconnect();
    logger.info('💤 Process terminated gracefully.');
  });
});

startServer();
