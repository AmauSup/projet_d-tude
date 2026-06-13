'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Pool de connexions PostgreSQL (Neon en production, local en dev).
// Un pool réutilise des connexions ouvertes plutôt que d'en créer une par requête,
// ce qui améliore significativement les performances sous charge.
// SSL activé uniquement si l'URL contient "neon.tech" (cloud) pour éviter les erreurs en dev local.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('neon.tech')
    ? { rejectUnauthorized: false }
    : undefined,
});

// ── SYSTÈME SSE (Server-Sent Events) ─────────────────────────────────────────
// sseClients : ensemble de toutes les connexions SSE ouvertes (une par onglet navigateur).
// broadcastHomeUpdate() : envoie un événement JSON à tous les clients connectés
// dès qu'une modification admin affecte la page d'accueil (carrousel, catégories, produits...).
// Côté frontend, App.jsx reçoit cet événement et recharge les données storefront.
// Si un client est déconnecté (onglet fermé), l'écriture échoue → on le retire du Set.
const sseClients = new Set();

function broadcastHomeUpdate() {
  const payload = `data: ${JSON.stringify({ type: 'home-updated', ts: Date.now() })}\n\n`;
  for (const client of sseClients) {
    try { client.write(payload); } catch { sseClients.delete(client); }
  }
}

// JWT
const JWT_SECRET = process.env.JWT_SECRET || 'althea-dev-secret-change-in-prod';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '1d';

// Rate limiter maison (sans librairie externe).
// Stocke en mémoire le nombre de requêtes par IP sur une fenêtre de temps.
// Si la limite est dépassée → HTTP 429 (Too Many Requests).
// Attention : se réinitialise au redémarrage du serveur (pas persistant).
// Pour une production robuste, il faudrait utiliser Redis ou une librairie comme express-rate-limit.
const rateLimitMap = new Map();
function rateLimit(windowMs, max) {
  return (req, res, next) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const entry = rateLimitMap.get(key) || { count: 0, resetAt: now + windowMs };
    if (now > entry.resetAt) {
      entry.count = 0;
      entry.resetAt = now + windowMs;
    }
    entry.count += 1;
    rateLimitMap.set(key, entry);
    if (entry.count > max) {
      return res.status(429).json({ message: 'Trop de requêtes, veuillez réessayer plus tard.' });
    }
    return next();
  };
}

// Middleware d'authentification JWT.
// Extrait le token du header "Authorization: Bearer <token>",
// le vérifie avec JWT_SECRET, et attache le payload décodé à req.user.
// Utilisé sur toutes les routes protégées.
// Retourne 401 si le token est absent, 403 si le token est invalide ou expiré.
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token manquant' });
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: 'Token invalide ou expiré' });
    req.user = decoded;
    next();
  });
}

// Middleware admin : vérifie que l'utilisateur connecté a le flag is_admin=true.
// Toujours utilisé APRÈS authenticateToken (qui peuple req.user).
// Un utilisateur connecté mais non-admin reçoit un 403 Forbidden.
function requireAdmin(req, res, next) {
  if (!req.user?.is_admin) return res.status(403).json({ message: 'Accès réservé aux administrateurs.' });
  return next();
}

// Journalise chaque action admin dans la table admin_log.
// Utilisé pour l'audit et la traçabilité des modifications (qui a fait quoi et quand).
// Les erreurs d'insertion sont ignorées silencieusement (.catch) pour ne pas bloquer
// l'action principale : si le log échoue, l'opération admin doit quand même réussir.
async function logAdmin(adminId, action, target) {
  await pool.query(
    'INSERT INTO admin_log (admin_id, action, target, created_at) VALUES ($1,$2,$3,NOW())',
    [adminId, action, target || null],
  ).catch((e) => console.warn('[admin_log]', e.message));
}

// Rate limiter admin (plus strict pour les mutations)
const adminRateLimit = rateLimit(15 * 60 * 1000, 200);

module.exports = {
  pool,
  sseClients,
  broadcastHomeUpdate,
  JWT_SECRET,
  JWT_EXPIRES,
  authenticateToken,
  requireAdmin,
  rateLimit,
  logAdmin,
  adminRateLimit,
  bcrypt,
  jwt,
};
