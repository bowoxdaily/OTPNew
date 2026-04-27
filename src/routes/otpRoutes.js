const express = require('express');
const {
  buyNumber,
  checkOtp,
  getAdminSummary,
  getNegaraCatalog,
  getOperatorCatalog,
  getLayananCatalog,
  getUserOrdersHandler,
  getAllOrdersHandler,
  cancelOrderHandler,
  setOrderReadyHandler,
} = require('../controllers/otpController');

const {
  syncLayananByCountry,
  syncAllLayanan,
  getCacheStatusByCountry,
} = require('../controllers/cacheController');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');
const { orderLimiter, perUserCooldown, trackActiveOrder, auditLog } = require('../middlewares/securityMiddleware');

const router = express.Router();

// Beli nomor (potong saldo lokal -> call provider order.php)
// Rate limited: max 10/menit per IP + 1 per 5 detik per user + max 3 pesanan aktif
router.post('/orders', requireAuth, orderLimiter, perUserCooldown, trackActiveOrder, auditLog('BUY_NUMBER'), buyNumber);

// Cek OTP (forward ke provider sms.php)
router.get('/orders/:id/otp', requireAuth, checkOtp);

// Ambil riwayat order user
router.get('/orders', requireAuth, getUserOrdersHandler);

// Ambil riwayat order admin
router.get('/admin/orders', requireAuth, requireRole('admin'), getAllOrdersHandler);

// Cancel Order & Refund Saldo
router.post('/orders/:id/cancel', requireAuth, cancelOrderHandler);

// Set Order Ready (VirtuSIM requirement to receive OTP)
router.post('/orders/:id/ready', requireAuth, setOrderReadyHandler);

router.get('/admin/summary', requireAuth, requireRole('admin'), getAdminSummary);
router.get('/catalog/negara', requireAuth, getNegaraCatalog);
router.get('/catalog/operator', requireAuth, getOperatorCatalog);
router.get('/catalog/layanan', requireAuth, getLayananCatalog);

// Cache management (admin only)
router.post('/admin/cache/sync-all', requireAuth, requireRole('admin'), auditLog('CACHE_SYNC_ALL'), syncAllLayanan);
router.post('/admin/cache/sync/:countryId', requireAuth, requireRole('admin'), auditLog('CACHE_SYNC'), syncLayananByCountry);
router.get('/admin/cache/status/:countryId', requireAuth, requireRole('admin'), getCacheStatusByCountry);

module.exports = router;
