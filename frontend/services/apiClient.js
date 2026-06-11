const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
const AUTH_TOKEN_KEY = 'althea-auth-token';

function getStoredToken() {
  return window.localStorage.getItem(AUTH_TOKEN_KEY) || window.sessionStorage.getItem(AUTH_TOKEN_KEY) || '';
}

function buildHeaders(body, extraHeaders = {}) {
  const headers = { ...extraHeaders };
  const token = getStoredToken();

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

// remember=true → localStorage (persiste après fermeture navigateur)
// remember=false → sessionStorage (effacé à la fermeture de l'onglet)
export function persistAuthToken(token, remember = true) {
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
  window.sessionStorage.removeItem(AUTH_TOKEN_KEY);
  if (token) {
    if (remember) {
      window.localStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      window.sessionStorage.setItem(AUTH_TOKEN_KEY, token);
    }
  }
}

export function getStoredAuthToken() {
  return getStoredToken();
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
  delete(path, body) {
    return request(path, { method: 'DELETE', body });
  },
};
