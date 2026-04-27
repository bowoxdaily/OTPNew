const express = require('express');
const { requestTopup, getTopupHistory, getPendingTopups, approveTopup, rejectTopup, gobizWebhook } = require('../controllers/paymentController');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');

const router = express.Router();

// Route untuk user topup
router.post('/topup', requireAuth, requestTopup);
router.get('/topup', requireAuth, getTopupHistory);
router.get('/mutations', requireAuth, require('../controllers/paymentController').getMutationHistory);

// Route untuk Admin Appprove Topup
router.get('/admin/topup/pending', requireAuth, requireRole('admin'), getPendingTopups);
router.post('/admin/topup/:id/approve', requireAuth, requireRole('admin'), approveTopup);
router.post('/admin/topup/:id/reject', requireAuth, requireRole('admin'), rejectTopup);

// Route callback GoBiz Scraper / Gateway
router.post('/webhooks/gobiz-transactions', gobizWebhook);
router.post('/webhooks/settlement', gobizWebhook); // Alias untuk gateway subscriber

module.exports = router;
