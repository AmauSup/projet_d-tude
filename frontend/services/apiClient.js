// URL de base du backend, configurable via variable d'environnement Vite.
// En développement, pointe vers le serveur local (port 3001).
// En production, on définit VITE_API_BASE_URL dans le fichier .env.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Clé unique utilisée pour stocker le JWT dans le navigateur (localStorage ou sessionStorage).
// Centraliser la clé ici évite les fautes de frappe et facilite un éventuel renommage.
const AUTH_TOKEN_KEY = 'althea-auth-token';

// Cherche le token d'authentification dans les deux espaces de stockage du navigateur.
// localStorage est vérifié en premier : il persiste même après la fermeture du navigateur (mode "Se souvenir de moi").
// sessionStorage est le fallback : il est effacé dès que l'onglet est fermé (session temporaire).
function getStoredToken() {
  return window.localStorage.getItem(AUTH_TOKEN_KEY) || window.sessionStorage.getItem(AUTH_TOKEN_KEY) || '';
}

// Construit les en-têtes HTTP pour chaque requête.
// - Content-Type est ajouté uniquement si on envoie un body (POST/PUT/PATCH) pour indiquer
//   au serveur que le corps est du JSON. Un GET sans body ne doit pas avoir ce header.
// - Authorization est ajouté si l'utilisateur est connecté, pour prouver son identité au backend.
//   Le format "Bearer <token>" est la convention standard pour les API REST avec JWT.
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

// Wrapper central autour du fetch natif du navigateur.
// Toutes les requêtes HTTP du projet passent par ici, ce qui centralise :
//   1. La sérialisation du body en JSON (JSON.stringify).
//   2. La désérialisation de la réponse (response.text → JSON.parse).
//      On lit d'abord en texte brut car certaines routes renvoient un corps vide (204 No Content).
//   3. La gestion des erreurs HTTP : si le statut n'est pas 2xx, on lance une exception.
//   4. La gestion du token expiré (401 Unauthorized) : on efface le token du stockage local
//      et on émet un événement DOM global "althea:unauthorized". App.jsx écoute cet événement
//      pour déclencher la déconnexion automatique sans que chaque composant ait à le gérer.
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
    if (response.status === 401) {
      // Le token est expiré ou invalide : on le supprime des deux storages
      // pour éviter qu'il soit renvoyé inutilement aux prochaines requêtes.
      globalThis.localStorage?.removeItem(AUTH_TOKEN_KEY);
      globalThis.sessionStorage?.removeItem(AUTH_TOKEN_KEY);
      // On notifie l'application via un événement personnalisé plutôt qu'un appel direct,
      // pour découpler ce module bas niveau du reste de l'application (pas d'import React ici).
      globalThis.dispatchEvent?.(new CustomEvent('althea:unauthorized'));
    }
    throw new Error(payload?.message || `Erreur HTTP ${response.status}`);
  }

  return payload;
}

// Stocke le JWT reçu après une connexion réussie, selon le choix "Se souvenir de moi".
// remember=true  → localStorage  : le token survit à la fermeture du navigateur.
// remember=false → sessionStorage : le token est effacé à la fermeture de l'onglet.
// On nettoie TOUJOURS les deux storages avant d'écrire pour éviter tout conflit
// (ex : un token qui traînerait dans localStorage après une session sessionStorage).
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

// Exposé publiquement pour permettre aux composants de lire le token courant
// (par exemple pour vérifier si l'utilisateur est connecté au démarrage).
export function getStoredAuthToken() {
  return getStoredToken();
}

// Crée une connexion SSE (Server-Sent Events) vers le backend.
// SSE est une connexion HTTP unidirectionnelle persistante : le serveur peut pousser des données
// au client à tout moment, sans que le client ait à interroger le serveur régulièrement (polling).
// On utilise API_BASE_URL pour que l'URL cible soit cohérente avec les autres appels API.
export function createEventSource(path) {
  return new EventSource(`${API_BASE_URL}${path}`);
}

// Objet exposant les 5 méthodes HTTP courantes.
// Chaque méthode délègue à request() qui gère les headers, l'authentification et les erreurs.
// Ce pattern "façade" permet d'appeler apiClient.get('/pg/products') plutôt que
// fetch(API_BASE_URL + '/pg/products', { method: 'GET', headers: {...} }).
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
