const express = require('express');
const { getSettings, saveSettings } = require('../controllers/paymentGatewaySettingsController');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');
const { auditLog } = require('../middlewares/securityMiddleware');

const router = express.Router();

router.get('/', requireAuth, requireRole('admin'), getSettings);
router.post('/', requireAuth, requireRole('admin'), auditLog('UPDATE_PAYMENT_GATEWAY_SETTINGS'), saveSettings);

module.exports = router;
