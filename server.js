/**
 * Unified Single-Domain Production Server (Hostinger hPanel Ready)
 *
 * Serves EVERYTHING on a single domain and single PORT:
 *   - /api/v1/*   -> Express REST API Backend
 *   - /health     -> Backend Healthcheck
 *   - /socket.io  -> Socket.IO Real-Time Chat Engine
 *   - /*          -> Next.js Frontend Application
 */

'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const { createRequire } = require('module');

const rootDir = __dirname;
const backendDir = path.join(rootDir, 'backend');
const frontendDir = path.join(rootDir, 'frontend');

// 1. Load backend/.env locally if present (Hostinger panel env vars always take priority)
const backendRequire = createRequire(path.join(backendDir, 'package.json'));
const frontendRequire = createRequire(path.join(frontendDir, 'package.json'));

const backendEnvPath = path.join(backendDir, '.env');
if (fs.existsSync(backendEnvPath)) {
  const dotenv = backendRequire('dotenv');
  dotenv.config({ path: backendEnvPath });
}

// Force production mode unless explicitly overridden
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// 2. Load compiled Backend modules
const { createApp } = require(path.join(backendDir, 'dist', 'app.js'));
const { initSocketServer } = require(path.join(backendDir, 'dist', 'sockets', 'socket.server.js'));
const prisma = require(path.join(backendDir, 'dist', 'config', 'prisma.js')).default;
const logger = require(path.join(backendDir, 'dist', 'utils', 'logger.js')).default;

// 3. Load Next.js from frontend/node_modules
const next = frontendRequire('next');
const dev = process.env.NEXT_DEV === 'true';
const nextApp = next({ dev, dir: frontendDir });
const nextHandler = nextApp.getRequestHandler();

const PORT = Number(process.env.PORT) || 3000;

async function startUnifiedServer() {
  try {
    // Prepare Next.js production build
    logger.info('⏳ Preparing Next.js frontend...');
    await nextApp.prepare();
    logger.info('✅ Next.js frontend ready');

    // Create unified Express app (API routes + Next.js passthrough)
    const app = createApp({ unifiedFrontend: true });

    // Delegate all non-API routes to Next.js
    app.all('*', (req, res) => {
      return nextHandler(req, res);
    });

    // Attach HTTP Server + Socket.IO Real-Time Chat Engine
    const server = http.createServer(app);
    initSocketServer(server);

    // Connect to Supabase PostgreSQL with retry resilience
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info(`🔄 Connecting to database (Attempt ${attempt}/${maxRetries})...`);
        await prisma.$connect();
        logger.info('🐘 PostgreSQL Database connected via Prisma');
        break;
      } catch (err) {
        if (attempt === maxRetries) {
          throw err;
        }
        logger.warn(`⚠️ DB attempt ${attempt} failed (${err.message}). Retrying in 3s...`);
        await new Promise((r) => setTimeout(r, 3000));
      }
    }

    server.listen(PORT, () => {
      logger.info(`🚀 Unified DSMS Server running on port ${PORT}`);
      logger.info(`🌐 Frontend:  http://localhost:${PORT}/`);
      logger.info(`📡 API:       http://localhost:${PORT}${process.env.API_PREFIX || '/api/v1'}`);
      logger.info(`💬 Socket.IO: http://localhost:${PORT}/socket.io`);
    });

    const shutdown = async (signal) => {
      logger.info(`👋 ${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        await prisma.$disconnect();
        logger.info('💤 Unified server closed cleanly.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('❌ Failed to start unified server:', error);
    process.exit(1);
  }
}

startUnifiedServer();
