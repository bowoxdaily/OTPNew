const {
  createUser,
  findByUsername,
  findById,
  sanitizeUser,
  verifyPassword,
} = require('../store/usersStore');
const { createToken } = require('../utils/token');

/**
 * Validate password strength
 * - Minimum 8 karakter
 * - Harus ada huruf besar, huruf kecil, dan angka
 */
function validatePasswordStrength(password) {
  if (typeof password !== 'string' || password.length < 8) {
    return 'Password minimal 8 karakter';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password harus mengandung huruf kecil';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password harus mengandung huruf besar';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password harus mengandung angka';
  }
  if (password.length > 128) {
    return 'Password maksimal 128 karakter';
  }
  return null; // Valid
}

async function register(req, res, next) {
  try {
    const { name, username, password } = req.body;
    if (!name || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Parameter wajib: name, username, password',
      });
    }

    // Validate username format
    const cleanUsername = String(username).trim();
    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      return res.status(400).json({
        success: false,
        message: 'Username harus 3-30 karakter',
      });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      return res.status(400).json({
        success: false,
        message: 'Username hanya boleh huruf, angka, dan underscore',
      });
    }

    // Validate name
    const cleanName = String(name).trim();
    if (cleanName.length < 2 || cleanName.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Nama harus 2-50 karakter',
      });
    }

    // Validate password strength
    const passwordError = validatePasswordStrength(String(password));
    if (passwordError) {
      return res.status(400).json({
        success: false,
        message: passwordError,
      });
    }

    const existingUser = await findByUsername(cleanUsername);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Username sudah terdaftar',
      });
    }

    const user = await createUser({
      name: cleanName,
      username: cleanUsername,
      password: String(password),
    });

    return res.status(201).json({
      success: true,
      message: 'Register berhasil',
      data: sanitizeUser(user),
    });
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username dan password wajib diisi',
      });
    }

    const user = await findByUsername(String(username).trim());

    // SECURITY: Use generic error message to prevent username enumeration
    if (!user || !verifyPassword(String(password), user.password_hash)) {
      return res.status(401).json({
        success: false,
        message: 'Username atau password salah',
      });
    }

    const token = createToken({
      sub: user.id,
      username: user.username,
      role: user.role,
    });

    return res.status(200).json({
      success: true,
      message: 'Login berhasil',
      data: {
        token,
        user: sanitizeUser(user),
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function me(req, res, next) {
  try {
    const user = await findById(req.user?.sub);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan',
      });
    }

    return res.status(200).json({
      success: true,
      data: sanitizeUser(user),
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  register,
  login,
  me,
};
