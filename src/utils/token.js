const jwt = require('jsonwebtoken');
const { authSecret } = require('../config/env');

/**
 * Create a JWT token (replaces custom HMAC implementation)
 * Uses industry-standard jsonwebtoken library for security
 */
function createToken(data, expiresInSeconds = 86400) {
  return jwt.sign(
    {
      sub: data.sub,
      username: data.username,
      role: data.role,
    },
    authSecret,
    {
      expiresIn: expiresInSeconds,
      algorithm: 'HS256',
      issuer: 'otp-reseller',
      audience: 'otp-reseller-api',
    }
  );
}

/**
 * Verify and decode a JWT token
 * Throws an error with statusCode if invalid
 */
function verifyToken(token) {
  try {
    const payload = jwt.verify(token, authSecret, {
      algorithms: ['HS256'],
      issuer: 'otp-reseller',
      audience: 'otp-reseller-api',
    });
    return payload;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw Object.assign(new Error('Token sudah expired'), { statusCode: 401 });
    }
    if (error.name === 'JsonWebTokenError') {
      throw Object.assign(new Error('Token tidak valid'), { statusCode: 401 });
    }
    if (error.name === 'NotBeforeError') {
      throw Object.assign(new Error('Token belum aktif'), { statusCode: 401 });
    }
    throw Object.assign(new Error('Gagal memverifikasi token'), { statusCode: 401 });
  }
}

module.exports = {
  createToken,
  verifyToken,
};
