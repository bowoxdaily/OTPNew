const crypto = require('crypto');
const { supabase } = require('../services/supabaseClient');

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, hash] = String(storedHash || '').split(':');
  if (!salt || !hash) return false;
  try {
    const testHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(testHash, 'hex'));
  } catch (error) {
    // Prevent timing oracle on malformed hashes
    return false;
  }
}

function sanitizeUser(user) {
  if (!user) return null;
  const { password_hash, ...safeUser } = user;
  return safeUser;
}

async function listUsers() {
  const { data, error } = await supabase.from('users').select('*');
  if (error) {
    throw Object.assign(new Error('Gagal membaca data users'), { statusCode: 500, details: error.message });
  }
  return data || [];
}

async function findById(id) {
  // SECURITY: Validate id format before querying
  if (!id || typeof id !== 'string' || id.length > 100) {
    return null;
  }
  const { data, error } = await supabase.from('users').select('*').eq('id', id).maybeSingle();
  if (error) {
    throw Object.assign(new Error('Gagal membaca user by id'), { statusCode: 500, details: error.message });
  }
  return data || null;
}

async function findByUsername(username) {
  // SECURITY: Validate username format
  if (!username || typeof username !== 'string' || username.length > 50) {
    return null;
  }
  const { data, error } = await supabase.from('users').select('*').eq('username', username).maybeSingle();
  if (error) {
    throw Object.assign(new Error('Gagal membaca user by username'), { statusCode: 500, details: error.message });
  }
  return data || null;
}

async function createUser({ name, username, password }) {
  const { data, error } = await supabase
    .from('users')
    .insert({
      username,
      name,
      role: 'user',
      password_hash: hashPassword(password),
      balance: 0, // Ditetapkan ke 0, user harus topup dulu
    })
    .select('*')
    .single();

  if (error) {
    throw Object.assign(new Error('Gagal membuat user'), { statusCode: 500, details: error.message });
  }
  return data;
}

async function updateBalance(id, balance) {
  const { data, error } = await supabase
    .from('users')
    .update({ balance })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw Object.assign(new Error('Gagal update saldo user'), { statusCode: 500, details: error.message });
  }
  return data;
}

/**
 * SECURITY: Atomic balance deduction — prevents double-spending race condition.
 *
 * Uses Supabase RPC to execute:
 *   UPDATE users SET balance = balance - amount WHERE id = $1 AND balance >= amount RETURNING balance;
 *
 * If the RPC function doesn't exist, falls back to optimistic locking pattern:
 *   1. Read current balance
 *   2. Check balance >= amount
 *   3. Update with WHERE balance = currentBalance (optimistic lock)
 *   4. If 0 rows updated → concurrent modification detected → retry or fail
 *
 * Returns updated user data or null if insufficient balance.
 */
async function atomicDeductBalance(userId, amount) {
  if (!userId || !Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  // Attempt 1: Try Supabase RPC (if the function exists)
  try {
    const { data, error } = await supabase.rpc('deduct_balance', {
      p_user_id: userId,
      p_amount: amount,
    });

    if (!error && data !== null && data !== undefined) {
      // RPC returned the new balance
      const newBalance = typeof data === 'object' ? data.balance : data;
      return { id: userId, balance: Number(newBalance) };
    }

    // If RPC doesn't exist (42883) or other error, fall through to fallback
    if (error && error.code !== '42883') {
      console.error('[atomicDeductBalance] RPC error:', error.message);
    }
  } catch (rpcError) {
    // RPC not available, use fallback
  }

  // Attempt 2: Optimistic locking fallback
  const maxRetries = 3;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Read current balance
    const user = await findById(userId);
    if (!user) return null;

    const currentBalance = Number(user.balance);
    if (currentBalance < amount) {
      return null; // Insufficient balance
    }

    const newBalance = currentBalance - amount;

    // Conditional update — only succeeds if balance hasn't changed
    const { data, error, count } = await supabase
      .from('users')
      .update({ balance: newBalance })
      .eq('id', userId)
      .eq('balance', currentBalance) // Optimistic lock condition
      .select('*')
      .single();

    if (!error && data) {
      return data; // Success
    }

    // If update failed due to concurrent modification, retry
    console.warn(`[atomicDeductBalance] Optimistic lock failed, retry ${attempt + 1}/${maxRetries}`);

    // Small random delay before retry to reduce collision
    await new Promise((resolve) => setTimeout(resolve, 50 + Math.random() * 100));
  }

  console.error(`[atomicDeductBalance] Failed after ${maxRetries} retries for user ${userId}`);
  throw Object.assign(new Error('Gagal memproses transaksi. Coba lagi.'), { statusCode: 409 });
}

async function atomicRefundBalance(userId, amount) {
  if (!userId || !Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  const maxRetries = 3;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const user = await findById(userId);
    if (!user) return null;

    const currentBalance = Number(user.balance);
    const newBalance = currentBalance + amount;

    const { data, error } = await supabase
      .from('users')
      .update({ balance: newBalance })
      .eq('id', userId)
      .eq('balance', currentBalance)
      .select('*')
      .single();

    if (!error && data) {
      return data;
    }
    await new Promise((resolve) => setTimeout(resolve, 50 + Math.random() * 100));
  }

  console.error(`[atomicRefundBalance] Failed after ${maxRetries} retries for user ${userId}`);
  throw Object.assign(new Error('Gagal memproses refund. Coba lagi.'), { statusCode: 409 });
}

async function ensureSeedUsers() {
  const existingUsers = await listUsers();
  if (existingUsers.length > 0) {
    return;
  }

  console.warn('⚠️  Membuat seed users dengan password default. Segera ganti password di production!');

  const seed = [
    {
      id: 'admin_1',
      username: 'admin',
      name: 'Admin OTP',
      role: 'admin',
      password_hash: hashPassword('admin123'),
      balance: 0,
    },
    {
      id: 'user_1',
      username: 'reseller',
      name: 'Demo User',
      role: 'user',
      password_hash: hashPassword('user123'),
      balance: 0, // diubah ke 0 agar demo user tidak langsung bisa order
    },
  ];

  const { error } = await supabase.from('users').insert(seed);
  if (error) {
    throw Object.assign(new Error('Gagal membuat seed users'), { statusCode: 500, details: error.message });
  }
}

module.exports = {
  findById,
  findByUsername,
  createUser,
  updateBalance,
  atomicDeductBalance,
  atomicRefundBalance,
  ensureSeedUsers,
  listUsers,
  verifyPassword,
  sanitizeUser,
};
