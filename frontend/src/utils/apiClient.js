import { clearUserSession, getAuthToken } from './authSession';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');

function buildApiUrl(url) {
  if (typeof url !== 'string') return url;
  if (/^https?:\/\//i.test(url) || !API_BASE_URL) return url;
  if (API_BASE_URL.startsWith('/') && url.startsWith(API_BASE_URL)) return url;
  if (url.startsWith('/')) return `${API_BASE_URL}${url}`;
  return `${API_BASE_URL}/${url}`;
}

export async function apiFetch(url, options = {}) {
  const token = getAuthToken();
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(options.headers || {}),
  };
  if (!isFormData && !headers['Content-Type'] && !headers['content-type']) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(buildApiUrl(url), {
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
