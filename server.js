/**
 * Unified Single-Domain Production Server (Hostinger Resilient Launcher)
 *
 * Serves EVERYTHING on a single domain and single PORT:
 *   - /api/v1/*   -> Express REST API Backend
 *   - /health     -> Real-time Healthcheck & System Diagnostics
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
const logsDir = path.join(rootDir, 'logs');

if (!fs.existsSync(logsDir)) {
  try {
    fs.mkdirSync(logsDir, { recursive: true });
  } catch {}
}

const startupLogFile = path.join(logsDir, 'startup.log');
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  process.stdout.write(line);
  try {
    fs.appendFileSync(startupLogFile, line);
  } catch {}
}

log('==================================================');
log('🚀 Starting DSMS Unified Production Server bootstrap');
log(`📂 Root Directory: ${rootDir}`);
log(`⚙️ Node Version:   ${process.version}`);
log('==================================================');

// 1. Comprehensive Environment Variable Loader
function loadEnvironmentVariables() {
  const envCandidates = [
    path.join(rootDir, '.env'),
    path.join(backendDir, '.env'),
    path.join(frontendDir, '.env'),
    path.join(frontendDir, '.env.production'),
    path.join(frontendDir, '.env.local'),
  ];

  let dotenv = null;
  try {
    dotenv = require('dotenv');
  } catch {
    try {
      const backendRequire = createRequire(path.join(backendDir, 'package.json'));
      dotenv = backendRequire('dotenv');
    } catch {}
  }

  if (dotenv) {
    for (const envPath of envCandidates) {
      if (fs.existsSync(envPath)) {
        try {
          dotenv.config({ path: envPath });
          log(`📄 Loaded environment variables from: ${envPath}`);
        } catch (err) {
          log(`⚠️ Failed to parse env file "${envPath}": ${err.message}`);
        }
      }
    }
  } else {
    log('⚠️ dotenv module not found in root or backend; relying on system process.env');
  }
}

loadEnvironmentVariables();

// Force production mode unless explicitly overridden
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
const PORT = Number(process.env.PORT) || 3000;

// Lifecycle State
let serverStatus = 'initializing'; // 'initializing' | 'ready' | 'error'
let startupError = null;
let expressApp = null;
let nextHandler = null;

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// 2. Start HTTP Server IMMEDIATELY to prevent LiteSpeed / Passenger 503 Gateway Timeouts!
const server = http.createServer((req, res) => {
  // Always responsive Healthcheck & Status API
  if (req.url === '/health' || req.url === '/api/health') {
    res.setHeader('Content-Type', 'application/json');
    if (serverStatus === 'ready') {
      res.statusCode = 200;
      return res.end(
        JSON.stringify(
          {
            status: 'healthy',
            mode: 'unified-single-domain',
            port: PORT,
            timestamp: new Date().toISOString(),
          },
          null,
          2
        )
      );
    } else if (serverStatus === 'initializing') {
      res.statusCode = 200;
      return res.end(
        JSON.stringify(
          {
            status: 'booting',
            message: 'Unified server is warming up and preparing Next.js / Backend...',
            timestamp: new Date().toISOString(),
          },
          null,
          2
        )
      );
    } else {
      res.statusCode = 500;
      return res.end(
        JSON.stringify(
          {
            status: 'error',
            message: startupError ? startupError.message : 'Unknown startup error',
            stack: startupError ? startupError.stack : null,
            timestamp: new Date().toISOString(),
          },
          null,
          2
        )
      );
    }
  }

  // If in ERROR state, show descriptive diagnostic screen instead of LiteSpeed 503
  if (serverStatus === 'error') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.statusCode = 500;
    const errorHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>DSMS - System Diagnostics</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 40px 20px; }
    .card { max-width: 860px; margin: 0 auto; background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    h1 { color: #f87171; font-size: 24px; margin-top: 0; display: flex; align-items: center; gap: 10px; }
    p { font-size: 15px; color: #94a3b8; line-height: 1.6; }
    pre { background: #020617; color: #fca5a5; padding: 18px; border-radius: 8px; overflow-x: auto; font-size: 13px; line-height: 1.5; border: 1px solid #7f1d1d; white-space: pre-wrap; word-break: break-all; }
    .guide { background: #0f172a; border-left: 4px solid #38bdf8; padding: 18px; border-radius: 0 8px 8px 0; margin-top: 24px; }
    .guide h3 { margin: 0 0 10px 0; color: #38bdf8; font-size: 16px; }
    .guide ul { margin: 0; padding-left: 20px; color: #cbd5e1; font-size: 14px; line-height: 1.8; }
    .btn { display: inline-block; margin-top: 24px; background: #3b82f6; color: #fff; padding: 10px 22px; border-radius: 6px; text-decoration: none; font-weight: 600; cursor: pointer; border: none; font-size: 14px; }
    .btn:hover { background: #2563eb; }
  </style>
</head>
<body>
  <div class="card">
    <h1>⚠️ DSMS Server Initialization Diagnostic</h1>
    <p>The Node.js server process is running, but encountered an initialization issue during startup:</p>
    <pre>${escapeHtml(startupError ? (startupError.stack || startupError.message) : 'Unknown startup error')}</pre>
    <div class="guide">
      <h3>Troubleshooting Checklist:</h3>
      <ul>
        <li><strong>Missing Environment Variables?</strong> In Hostinger hPanel ➔ Node.js ➔ Environment Variables, verify that <code>DATABASE_URL</code>, <code>DIRECT_URL</code>, <code>SUPABASE_URL</code>, <code>SUPABASE_ANON_KEY</code>, <code>SUPABASE_SERVICE_ROLE_KEY</code>, and <code>SUPABASE_JWT_SECRET</code> are entered without wrapping quotes.</li>
        <li><strong>Missing Compiled Build?</strong> If <code>backend/dist</code> or <code>frontend/.next</code> is reported missing, run <code>npm run build</code> in Hostinger's terminal or deploy script.</li>
        <li><strong>Database Connection?</strong> Ensure Supabase PostgreSQL pooler credentials and network accessibility are active.</li>
      </ul>
    </div>
    <button class="btn" onclick="location.reload()">🔄 Retry / Reload Server</button>
  </div>
</body>
</html>`;
    return res.end(errorHtml);
  }

  // If in INITIALIZING state, show graceful warmup page with auto-refresh
  if (serverStatus === 'initializing') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.statusCode = 200;
    const warmupHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>DSMS - Starting Server...</title>
  <meta http-equiv="refresh" content="3">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
    .box { background: #1e293b; border: 1px solid #334155; padding: 40px; border-radius: 12px; max-width: 420px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    .spinner { border: 4px solid #334155; border-top: 4px solid #38bdf8; border-radius: 50%; width: 44px; height: 44px; animation: spin 1s linear infinite; margin: 0 auto 20px; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    h2 { font-size: 20px; margin: 0 0 10px 0; color: #f8fafc; }
    p { font-size: 14px; color: #94a3b8; margin: 0; }
  </style>
</head>
<body>
  <div class="box">
    <div class="spinner"></div>
    <h2>Document Service Management</h2>
    <p>Initializing production engine and Next.js frontend... Refreshing in 3 seconds.</p>
  </div>
</body>
</html>`;
    return res.end(warmupHtml);
  }

  // Server is READY: route through Express (which routes API + Next.js)
  if (expressApp) {
    return expressApp(req, res);
  } else if (nextHandler) {
    return nextHandler(req, res);
  } else {
    res.statusCode = 200;
    res.end('DSMS Server is ready.');
  }
});

server.listen(PORT, () => {
  log(`🚀 Unified HTTP Server listening immediately on port ${PORT}`);
  initializeSubsystems();
});

// 3. Asynchronously Initialize Backend, Database, and Next.js Frontend
async function initializeSubsystems() {
  try {
    log('📦 Loading Backend and Database modules...');

    // Verify backend/dist exists
    const backendDistApp = path.join(backendDir, 'dist', 'app.js');
    if (!fs.existsSync(backendDistApp)) {
      throw new Error(
        `Compiled backend not found at "${backendDistApp}". Please ensure "npm run build" or "npm run build:backend" has run.`
      );
    }

    const { createApp } = require(backendDistApp);
    const { initSocketServer } = require(path.join(backendDir, 'dist', 'sockets', 'socket.server.js'));
    const prisma = require(path.join(backendDir, 'dist', 'config', 'prisma.js')).default;

    // Connect to database asynchronously (non-blocking, will not exit process on retry)
    prisma
      .$connect()
      .then(() => log('🐘 PostgreSQL Database connected successfully via Prisma'))
      .catch((err) => log(`⚠️ Database initial connection warning: ${err.message}`));

    // Prepare Next.js production build
    log('⏳ Preparing Next.js frontend application...');
    const frontendRequire = createRequire(path.join(frontendDir, 'package.json'));
    const next = frontendRequire('next');
    const dev = process.env.NEXT_DEV === 'true';
    const nextApp = next({ dev, dir: frontendDir });

    await nextApp.prepare();
    nextHandler = nextApp.getRequestHandler();
    log('✅ Next.js frontend ready');

    // Create unified Express application
    expressApp = createApp({ unifiedFrontend: true });

    // Delegate all non-API routes to Next.js handler
    expressApp.all('*', (req, res) => {
      return nextHandler(req, res);
    });

    // Attach Socket.IO real-time engine to HTTP Server
    initSocketServer(server);
    log('💬 Socket.IO real-time chat engine initialized');

    serverStatus = 'ready';
    log('✨ Unified DSMS server is 100% READY and accepting production traffic!');
  } catch (err) {
    startupError = err;
    serverStatus = 'error';
    log(`❌ Unified server failed to initialize: ${err.stack || err.message}`);
    // DO NOT call process.exit(1)! Keep HTTP server alive so diagnostics are visible in browser.
  }
}

// Graceful shutdown handling
const shutdown = async (signal) => {
  log(`👋 ${signal} received. Closing unified server gracefully...`);
  server.close(async () => {
    try {
      const prisma = require(path.join(backendDir, 'dist', 'config', 'prisma.js')).default;
      if (prisma) await prisma.$disconnect();
    } catch {}
    log('💤 Unified server shut down cleanly.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
