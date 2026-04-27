const express = require('express');
const router = express.Router();
const {
  upsertMarkupSetting,
  getMarkupSettings,
  deleteMarkupSetting,
  toggleMarkupActive,
} = require('../controllers/markupController');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');
const { auditLog } = require('../middlewares/securityMiddleware');

// Semua endpoint memerlukan auth + admin role
router.use(requireAuth);
router.use(requireRole('admin'));

/**
 * GET /admin/markups - Get all markup settings
 */
router.get('/', getMarkupSettings);

/**
 * POST /admin/markups - Create or update markup setting
 * Body: {
 *   service_id?: string (null for global),
 *   service_name?: string,
 *   markup_percentage: number,
 *   markup_fixed: number
 * }
 */
router.post('/', auditLog('UPSERT_MARKUP'), upsertMarkupSetting);

/**
 * PATCH /admin/markups/:id - Toggle active status
 * Body: { is_active: boolean }
 */
router.patch('/:id', auditLog('TOGGLE_MARKUP'), toggleMarkupActive);

/**
 * DELETE /admin/markups/:id - Delete markup setting
 */
router.delete('/:id', auditLog('DELETE_MARKUP'), deleteMarkupSetting);

module.exports = router;
