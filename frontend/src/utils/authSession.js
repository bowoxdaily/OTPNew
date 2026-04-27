const STORAGE_KEY = 'otp_reseller_session';

export function getUserSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

export function getUserRole() {
  const session = getUserSession();
  return session?.role === 'admin' ? 'admin' : 'user';
}

export function getAuthToken() {
  return getUserSession()?.token || '';
}

export function setUserSession({ username, role, token, userId, name }) {
  const safeRole = role === 'admin' ? 'admin' : 'user';
  const payload = {
    username: username || 'guest',
    userId: userId || '',
    name: name || '',
    role: safeRole,
    token: token || '',
    loginAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  return payload;
}

export function clearUserSession() {
  localStorage.removeItem(STORAGE_KEY);
}
