const { readDb } = require('../data/store');
const { getBearerToken } = require('../utils/auth');
const { sendError } = require('../utils/http');

async function requireAuth(req, res) {
  const token = getBearerToken(req);
  const db = await readDb();

  const session = db.sessions.find(s => s.token === token);
  if (!session) {
    sendError(res, 401, 'Authentification requise');
    return null;
  }

  const user = db.users.find(u => u.id === session.userId);
  return { user, db };
}

module.exports = { requireAuth };