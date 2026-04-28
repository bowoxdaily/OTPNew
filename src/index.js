const express = require('express');
const fileUpload = require('express-fileupload');
const otpRoutes = require('./routes/otpRoutes');
const authRoutes = require('./routes/authRoutes');
const markupRoutes = require('./routes/markupRoutes');
const brandingRoutes = require('./routes/brandingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const paymentGatewaySettingsRoutes = require('./routes/paymentGatewaySettingsRoutes');
const { port, authSecret, trustProxy, shutdownTimeoutMs } = require('./config/env');
const { startPolling, stopPolling, getPollingStatus } = require('./services/gobizPollingService');
const { startCronJobs } = require('./services/cronService');
const { ensureSeedUsers } = require('./store/usersStore');
const { supabase } = require('./services/supabaseClient');
const {
  helmetMiddleware,
  corsMiddleware,
  generalLimiter,
  sanitizeBody,
} = require('./middlewares/securityMiddleware');

const app = express();
let server = null;
let isShuttingDown = false;

// App runs behind Nginx/aaPanel in production, so trust proxy headers for real client IP.
app.set('trust proxy', trustProxy);

// ── Security Middleware ───────────────────────────────────
app.use(helmetMiddleware);       // Security headers (XSS, clickjacking, etc.)
app.use(corsMiddleware);         // CORS whitelist

// Explicit preflight handler — guarantees 204 for OPTIONS even behind
// Nginx/Apache reverse proxies that sometimes swallow the cors() response.
app.options('*', corsMiddleware);
// Rate limiting applied selectively — public read-only endpoints
// (branding, health, static uploads) are exempt to prevent
// "Terlalu banyak request" errors on every page load.
app.use((req, res, next) => {
  // Skip rate-limit for public read-only endpoints
  const exempt =
    req.method === 'OPTIONS' ||
    req.path === '/health' ||
    req.path === '/ready' ||
    req.path.startsWith('/uploads') ||
    (req.method === 'GET' && req.path === '/api/admin/branding');
  if (exempt) return next();
  return generalLimiter(req, res, next);
});
app.disable('x-powered-by');     // Hide Express fingerprint

// ── Body Parsing (with size limits) ──────────────────────
app.use(express.json({
  limit: '1mb',
  verify: (req, res, buf) => {
    req.rawBody = buf?.toString('utf8') || '';
  },
}));      // Limit JSON body size
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(sanitizeBody);           // Sanitize all string inputs

// ── File Upload (with security limits) ───────────────────
app.use(fileUpload({
  limits: { fileSize: 2 * 1024 * 1024 }, // Max 2MB file size
  abortOnLimit: true,
  responseOnLimit: 'File terlalu besar. Maksimal 2MB.',
  safeFileNames: true,           // Strip special chars from filename
  preserveExtension: 4,          // Keep extension up to 4 chars
}));

app.use('/uploads', express.static('uploads'));

// ── Health Check ─────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', shutting_down: isShuttingDown });
});

app.get('/ready', async (req, res) => {
  if (isShuttingDown) {
    return res.status(503).json({
      status: 'not_ready',
      reason: 'Server is shutting down',
    });
  }

  try {
    const pollingStatus = getPollingStatus();
    const { error } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (error) {
      return res.status(503).json({
        status: 'not_ready',
        reason: `Database check failed: ${error.message}`,
        polling: pollingStatus,
      });
    }

    if (pollingStatus.isFileStale) {
      return res.status(503).json({
        status: 'not_ready',
        reason: 'GoBiz transactions file is stale',
        polling: pollingStatus,
      });
    }

    return res.status(200).json({
      status: 'ready',
      polling: pollingStatus,
    });
  } catch (error) {
    return res.status(503).json({
      status: 'not_ready',
      reason: error.message || 'Unexpected readiness check failure',
    });
  }
});

// ── API Routes ───────────────────────────────────────────
app.use('/api', otpRoutes);
app.use('/api', authRoutes);
app.use('/api/admin/markups', markupRoutes);
app.use('/api/admin/branding', brandingRoutes);
app.use('/api/admin/payment-gateway', paymentGatewaySettingsRoutes);
app.use('/api', paymentRoutes);
app.use('/', paymentRoutes); // Mount at root so /webhooks/tripay works exactly

// ── 404 Handler ──────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint tidak ditemukan',
  });
});

// ── Global Error Handler (sanitized — no stack leak) ─────
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  // Log full error internally
  console.error('[ERROR]', {
    status: statusCode,
    message: err.message,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
    ip: req.ip,
    user: req.user?.sub || 'anonymous',
  });

  // Send sanitized response to client — NEVER expose stack trace
  if (!res.headersSent) {
    res.status(statusCode).json({
      success: false,
      message: statusCode >= 500
        ? 'Terjadi kesalahan internal server'  // Generic message for 5xx
        : (err.message || 'Terjadi kesalahan'),
      // No 'details', 'stack', or 'provider_response' leaked
    });
  }
});

// ── Unhandled Errors ─────────────────────────────────────
process.on('unhandledRejection', (reason, promise) => {
  console.error('[UNHANDLED REJECTION]', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[UNCAUGHT EXCEPTION]', error);
  process.exit(1);
});

function shutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`[SHUTDOWN] Received ${signal}. Closing server...`);

  stopPolling();

  const forceExitTimer = setTimeout(() => {
    console.error(`[SHUTDOWN] Force exit after ${shutdownTimeoutMs}ms`);
    process.exit(1);
  }, shutdownTimeoutMs);

  if (server) {
    server.close(() => {
      clearTimeout(forceExitTimer);
      console.log('[SHUTDOWN] HTTP server closed gracefully');
      process.exit(0);
    });
    return;
  }

  clearTimeout(forceExitTimer);
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ── Server Startup ───────────────────────────────────────
async function startServer() {
  // Validate auth secret is not default
  if (!authSecret || authSecret === 'change-this-secret') {
    console.error('⚠️  PERINGATAN KEAMANAN: AUTH_SECRET masih default! Ganti di .env sebelum production!');
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ FATAL: Tidak boleh menggunakan AUTH_SECRET default di production!');
      process.exit(1);
    }
  }

  try {
    await ensureSeedUsers();
    server = app.listen(port, () => {
      console.log(`OTP Reseller API running on port ${port}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

      // Start GoBiz D1 polling untuk auto-approve topup
      startPolling();
      
      // Start background cron jobs (Auto-cancel)
      startCronJobs();
    });
  } catch (error) {
    console.error('Gagal start server:', error.message);
    process.exit(1);
  }
}

startServer();
