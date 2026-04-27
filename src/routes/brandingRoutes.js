const express = require('express');
const router = express.Router();
const brandingController = require('../controllers/brandingController');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');
const { auditLog } = require('../middlewares/securityMiddleware');

/**
 * Get branding settings
 * GET /api/admin/branding
 */
router.get('/', brandingController.getBrandingSettings);

/**
 * Update branding settings
 * POST /api/admin/branding
 */
router.post('/', requireAuth, requireRole('admin'), auditLog('UPDATE_BRANDING'), brandingController.updateBrandingSettings);

/**
 * Upload branding file (logo or favicon)
 * POST /api/admin/branding/upload
 */
router.post('/upload', requireAuth, requireRole('admin'), auditLog('UPLOAD_BRANDING'), brandingController.uploadBrandingFile);

module.exports = router;
