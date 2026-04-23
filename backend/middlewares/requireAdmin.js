const { requireAuth } = require('./requireAuth');
const { sendError } = require('../utils/http');

async function requireAdmin(req, res) {
  const auth = await requireAuth(req, res);
  if (!auth) return null;

  if (auth.user.role !== 'admin') {
    sendError(res, 403, 'Accès refusé');
    return null;
  }

  return auth;
}

module.exports = { requireAdmin };