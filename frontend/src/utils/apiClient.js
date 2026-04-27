import { clearUserSession, getAuthToken } from './authSession';

export async function apiFetch(url, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearUserSession();
  }

  return response;
}

export async function readJsonSafe(response) {
  const raw = await response.text();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    return {
      success: false,
      message: 'Response server bukan JSON yang valid',
      raw,
    };
  }
}
