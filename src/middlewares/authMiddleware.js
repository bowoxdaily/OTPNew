const { verifyToken } = require('../utils/token');

function requireAuth(req, res, next) {
  const authorization = req.headers.authorization || '';
  const [type, token] = authorization.split(' ');

  if (type !== 'Bearer' || !token) {
    return res.status(401).json({
      success: false,
      message: 'Akses ditolak. Token tidak ditemukan.',
    });
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
    return next();
  } catch (error) {
    return res.status(error.statusCode || 401).json({
      success: false,
      message: error.message || 'Token tidak valid',
    });
  }
}

function requireRole(role) {
  return function roleGuard(req, res, next) {
    if (req.user?.role !== role) {
      return res.status(403).json({
        success: false,
        message: 'Role tidak memiliki akses ke endpoint ini',
      });
    }
    return next();
  };
}

module.exports = {
  authMiddleware: requireAuth,
  requireAuth,
  requireRole,
  adminMiddleware: requireRole('admin'),
};
