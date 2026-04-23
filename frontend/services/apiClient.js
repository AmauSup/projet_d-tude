const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
const AUTH_TOKEN_KEY = 'althea-auth-token';

function buildHeaders(body, extraHeaders = {}) {
  const headers = { ...extraHeaders };
  const token = window.localStorage.getItem(AUTH_TOKEN_KEY);

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function request(path, options = {}) {
  const { body, headers, ...rest } = options;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: buildHeaders(body, headers),
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(payload?.message || `Erreur HTTP ${response.status}`);
  }

  return payload;
}

export function persistAuthToken(token) {
  if (token) {
    window.localStorage.setItem(AUTH_TOKEN_KEY, token);
    return;
  }

  window.localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function getStoredAuthToken() {
  return window.localStorage.getItem(AUTH_TOKEN_KEY) || '';
}

export const apiClient = {
  get(path) {
    return request(path, { method: 'GET' });
  },
  post(path, body) {
    return request(path, { method: 'POST', body });
  },
  put(path, body) {
    return request(path, { method: 'PUT', body });
  },
  patch(path, body) {
    return request(path, { method: 'PATCH', body });
  },
};
