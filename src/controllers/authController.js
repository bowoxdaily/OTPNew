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
    const { name, username, password, email, phone } = req.body;
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

    // Validate email (optional but must be valid if provided)
    let cleanEmail = null;
    if (email) {
      cleanEmail = String(email).trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return res.status(400).json({
          success: false,
          message: 'Format email tidak valid',
        });
      }
      if (cleanEmail.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Email maksimal 100 karakter',
        });
      }
    }

    // Validate phone (optional but must be valid if provided)
    let cleanPhone = null;
    if (phone) {
      cleanPhone = String(phone).trim().replace(/[^0-9+]/g, '');
      // Normalize: 08xxx → +628xxx
      if (cleanPhone.startsWith('08')) {
        cleanPhone = '+62' + cleanPhone.slice(1);
      }
      // Must be 10-15 digits (after country code)
      const digitsOnly = cleanPhone.replace(/[^0-9]/g, '');
      if (digitsOnly.length < 10 || digitsOnly.length > 15) {
        return res.status(400).json({
          success: false,
          message: 'Nomor HP tidak valid (10-15 digit)',
        });
      }
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
      email: cleanEmail,
      phone: cleanPhone,
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

async function updateProfile(req, res, next) {
  try {
    const userId = req.user?.sub;
    const { name, email, phone } = req.body;

    const cleanName = name ? String(name).trim() : null;
    if (cleanName && (cleanName.length < 2 || cleanName.length > 50)) {
      return res.status(400).json({ success: false, message: 'Nama harus 2-50 karakter' });
    }

    let cleanEmail = null;
    if (email) {
      cleanEmail = String(email).trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return res.status(400).json({ success: false, message: 'Format email tidak valid' });
      }
    }

    let cleanPhone = null;
    if (phone) {
      cleanPhone = String(phone).trim().replace(/[^0-9+]/g, '');
      if (cleanPhone.startsWith('08')) cleanPhone = '+62' + cleanPhone.slice(1);
      const digits = cleanPhone.replace(/[^0-9]/g, '');
      if (digits.length < 10 || digits.length > 15) {
        return res.status(400).json({ success: false, message: 'Nomor HP tidak valid (10-15 digit)' });
      }
    }

    const updateData = { updated_at: new Date().toISOString() };
    if (cleanName) updateData.name = cleanName;
    if (cleanEmail) updateData.email = cleanEmail;
    if (cleanPhone) updateData.phone = cleanPhone;

    const { supabase } = require('../services/supabaseClient');
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select('*')
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: 'Profil berhasil diperbarui',
      data: sanitizeUser(data),
    });
  } catch (error) {
    return next(error);
  }
}

async function changePassword(req, res, next) {
  try {
    const userId = req.user?.sub;
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ success: false, message: 'Password lama dan baru wajib diisi' });
    }

    const user = await findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });

    if (!verifyPassword(String(current_password), user.password_hash)) {
      return res.status(401).json({ success: false, message: 'Password lama tidak sesuai' });
    }

    const passwordError = validatePasswordStrength(String(new_password));
    if (passwordError) {
      return res.status(400).json({ success: false, message: passwordError });
    }

    const { hashPassword } = require('../store/usersStore');
    const { supabase } = require('../services/supabaseClient');
    const crypto = require('crypto');
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(new_password, salt, 10000, 64, 'sha512').toString('hex');
    const newPasswordHash = `${salt}:${hash}`;

    const { error } = await supabase
      .from('users')
      .update({ password_hash: newPasswordHash, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) throw error;

    return res.status(200).json({ success: true, message: 'Password berhasil diperbarui' });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  register,
  login,
  me,
  updateProfile,
  changePassword,
};
