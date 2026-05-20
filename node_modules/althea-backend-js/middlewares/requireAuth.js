'use strict';

const jwt = require('jsonwebtoken');
const { readDb } = require('../data/store');

const JWT_SECRET = process.env.JWT_SECRET || 'althea-dev-secret-change-in-prod';

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  if (!token) {
    res.status(401).json({ success: false, message: 'Authentification requise' });
    return;
  }

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    const isExpired = err?.name === 'TokenExpiredError';
    res.status(401).json({ success: false, message: isExpired ? 'Session expirée' : 'Token invalide' });
    return;
  }

  try {
    const db = await readDb();
    // Cherche l'utilisateur dans db.json (système legacy) puis par id JWT
    let user = db.users.find(
      (u) => u.id === decoded.id || String(u.id) === String(decoded.id),
    );

    // Si non trouvé dans db.json (utilisateur PostgreSQL uniquement), créer un objet minimal
    if (!user) {
      user = {
        id: decoded.id,
        role: decoded.is_admin ? 'admin' : 'customer',
        is_admin: decoded.is_admin,
        verified: true,
      };
    }

    req.auth = { db, user };
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = { requireAuth };
