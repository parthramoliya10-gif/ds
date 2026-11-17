import http from 'http';
import { createApp } from './app.js';
import env from './config/env.js';
import logger from './utils/logger.js';
import prisma from './config/prisma.js';

const app = createApp();
const server = http.createServer(app);

const startServer = async () => {
  try {
    // Verify database connection
    await prisma.$connect();
    logger.info('🐘 PostgreSQL Database successfully connected via Prisma');

    server.listen(env.PORT, () => {
      logger.info(`🚀 Document Service Management Backend running on port ${env.PORT}`);
      logger.info(`📡 API endpoint: http://localhost:${env.PORT}${env.API_PREFIX}`);
      logger.info(`🛡️ Environment: ${env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
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
