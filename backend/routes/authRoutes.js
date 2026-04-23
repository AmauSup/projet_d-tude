const { readDb, updateDb } = require('../data/store');
const { sendJson, sendError, readJsonBody } = require('../utils/http');
const { createToken, sanitizeUser } = require('../utils/auth');

const LOGIN_ROUTE = '/api/auth/login';

function isLoginRequest(req, pathname) {
  return req.method === 'POST' && pathname === LOGIN_ROUTE;
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function findUserByCredentials(users, email, password) {
  const normalizedEmail = normalizeEmail(email);

  return users.find((user) => (
    normalizeEmail(user.email) === normalizedEmail && user.password === password
  ));
}

async function createSessionForUser(userId) {
  const token = createToken();

  await updateDb((draft) => {
    draft.sessions.push({ token, userId });
  });

  return token;
}

async function login(req, res) {
  const body = await readJsonBody(req);
  const db = await readDb();
  const user = findUserByCredentials(db.users, body.email, body.password);

  if (!user) {
    sendError(res, 401, 'Identifiants invalides');
    return true;
  }

  const token = await createSessionForUser(user.id);

  sendJson(res, 200, {
    success: true,
    token,
    user: sanitizeUser(user),
  });

  return true;
}

async function handleAuthRoutes(req, res, { pathname }) {
  if (!isLoginRequest(req, pathname)) {
    return false;
  }

  return login(req, res);
}

module.exports = { handleAuthRoutes };
