const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

/**
 * Helmet — HTTP security headers
 * Protects against: XSS, clickjacking, MIME sniffing, etc.
 */
const helmetMiddleware = helmet({
  contentSecurityPolicy: false, // Disabled — frontend is a SPA served by Vite/Nginx, not by Express
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow images to be loaded cross-origin
});

/**
 * CORS — restrict API access to allowed origins
 */
const defaultAllowedOrigins = [
  'http://localhost:5173',  // Vite dev server
  'http://localhost:3000',  // Backend itself
  'https://otp.bowo-store.id',
  'https://www.otp.bowo-store.id',
  'https://bitnexid.com',
  'https://www.bitnexid.com',
  'https://otp.bitnexid.com',
  'https://www.otp.bitnexid.com',
];

const envAllowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

const allowedOrigins = [...new Set([...defaultAllowedOrigins, ...envAllowedOrigins])];
const envAllowedOriginSuffixes = (process.env.CORS_ALLOWED_ORIGIN_SUFFIXES || '')
  .split(',')
  .map((item) => item.trim().toLowerCase())
  .filter(Boolean);

function normalizeOrigin(origin) {
  if (!origin) return '';
  try {
    return new URL(origin).origin.toLowerCase();
  } catch (error) {
    return String(origin).trim().toLowerCase().replace(/\/+$/, '');
  }
}

const allowedOriginsSet = new Set(allowedOrigins.map(normalizeOrigin).filter(Boolean));

function isOriginAllowed(origin) {
  const normalized = normalizeOrigin(origin);
  if (!normalized) return true;
  if (allowedOriginsSet.has(normalized)) return true;

  try {
    const { hostname } = new URL(normalized);
    return envAllowedOriginSuffixes.some((suffix) => (
      hostname === suffix || hostname.endsWith(`.${suffix}`)
    ));
  } catch (error) {
    return false;
  }
}

const corsMiddleware = cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    console.warn(`[CORS] Origin blocked: ${origin}`);
    return callback(new Error('CORS: Origin tidak diizinkan'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // Cache preflight 24 jam
});

/**
 * Rate limiting — general API
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 500, // Max 500 mutating requests per 15 menit per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Terlalu banyak request. Coba lagi nanti.',
  },
});

/**
 * Rate limiting — auth routes (login/register) — ketat
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 10, // Max 10 percobaan login per 15 menit per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.',
  },
});

/**
 * Rate limiting — order/transactional routes (per IP)
 */
const orderLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 menit
  max: 10, // Max 10 order per menit per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Terlalu banyak order. Coba lagi nanti.',
  },
});

/**
 * Per-user cooldown — 1 order per 5 detik per akun
 * Mencegah spam klik tombol "Beli Nomor"
 */
const userOrderCooldowns = new Map(); // userId -> lastOrderTimestamp

function perUserCooldown(req, res, next) {
  const userId = req.user?.sub;
  if (!userId) return next();

  const now = Date.now();
  const lastOrder = userOrderCooldowns.get(userId) || 0;
  const cooldownMs = 5000; // 5 detik
  const diff = now - lastOrder;

  if (diff < cooldownMs) {
    const waitSec = Math.ceil((cooldownMs - diff) / 1000);
    return res.status(429).json({
      success: false,
      message: `Terlalu cepat! Tunggu ${waitSec} detik lagi sebelum memesan nomor baru.`,
    });
  }

  userOrderCooldowns.set(userId, now);

  // Bersihkan map secara periodik agar tidak memory-leak
  if (userOrderCooldowns.size > 10000) {
    const cutoff = now - 60000;
    for (const [uid, ts] of userOrderCooldowns) {
      if (ts < cutoff) userOrderCooldowns.delete(uid);
    }
  }

  next();
}

/**
 * Anti-concurrent orders — max 3 pesanan pending per akun
 * Mencegah user menimbun banyak nomor sekaligus
 */
const activeOrderCounts = new Map(); // userId -> count

function trackActiveOrder(req, res, next) {
  const userId = req.user?.sub;
  if (!userId) return next();

  const current = activeOrderCounts.get(userId) || 0;
  const MAX_CONCURRENT = 3;

  if (current >= MAX_CONCURRENT) {
    return res.status(429).json({
      success: false,
      message: `Anda sudah memiliki ${MAX_CONCURRENT} pesanan aktif. Selesaikan atau batalkan pesanan lama terlebih dahulu.`,
    });
  }

  // Increment counter
  activeOrderCounts.set(userId, current + 1);

  // Hook ke response untuk decrement setelah request selesai
  const originalJson = res.json.bind(res);
  res.json = function (body) {
    // Decrement hanya jika order gagal (saldo kurang, provider error, dll)
    if (!body?.success) {
      const c = activeOrderCounts.get(userId) || 1;
      activeOrderCounts.set(userId, Math.max(0, c - 1));
    }
    return originalJson(body);
  };

  next();
}

/**
 * Reset active order count for a user (dipanggil saat order selesai/dibatalkan)
 */
function decrementActiveOrder(userId) {
  if (!userId) return;
  const c = activeOrderCounts.get(userId) || 1;
  activeOrderCounts.set(userId, Math.max(0, c - 1));
}

/**
 * Sanitize string input — strip potential XSS
 */
function sanitizeString(value) {
  if (typeof value !== 'string') return value;
  return value
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove inline event handlers
    .trim();
}

/**
 * Request body sanitizer middleware
 */
function sanitizeBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    for (const key of Object.keys(req.body)) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeString(req.body[key]);
      }
    }
  }
  next();
}

/**
 * Audit logger — log sensitive operations
 */
function auditLog(action) {
  return function (req, res, next) {
    const userId = req.user?.sub || 'anonymous';
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const timestamp = new Date().toISOString();

    console.log(`[AUDIT] ${timestamp} | ${action} | user=${userId} | ip=${ip} | ${req.method} ${req.originalUrl}`);

    // Store original json method to log response status
    const originalJson = res.json.bind(res);
    res.json = function (body) {
      const success = body?.success ?? 'unknown';
      console.log(`[AUDIT] ${timestamp} | ${action} | result=${success} | status=${res.statusCode}`);
      return originalJson(body);
    };

    next();
  };
}

module.exports = {
  helmetMiddleware,
  corsMiddleware,
  generalLimiter,
  authLimiter,
  orderLimiter,
  perUserCooldown,
  trackActiveOrder,
  decrementActiveOrder,
  sanitizeBody,
  sanitizeString,
  auditLog,
};
