const express = require('express');
const { login, me, register } = require('../controllers/authController');
const { requireAuth } = require('../middlewares/authMiddleware');
const { authLimiter, auditLog } = require('../middlewares/securityMiddleware');

const router = express.Router();

// Auth routes dengan rate limiting ketat (10 req / 15 min)
router.post('/auth/register', authLimiter, auditLog('REGISTER'), register);
router.post('/auth/login', authLimiter, auditLog('LOGIN'), login);
router.get('/auth/me', requireAuth, me);

module.exports = router;
