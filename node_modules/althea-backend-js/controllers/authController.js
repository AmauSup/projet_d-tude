const { readDb } = require('../data/store');
const { createSessionForUser, deleteSession } = require('../services/sessionService');
const {
  createUser,
  findUserByCredentials,
  normalizeEmail,
  validateRegistrationPayload,
} = require('../services/userAuthService');
const { sanitizeUser } = require('../utils/auth');

function sendAuthResponse(res, user, token, status = 200) {
  res.status(status).json({
    success: true,
    token,
    user: sanitizeUser(user),
    userRole: user.role,
  });
}

async function login(req, res) {
  const db = await readDb();
  const user = findUserByCredentials(db.users, req.body.email, req.body.password);

  if (!user) {
    res.status(401).json({ success: false, message: 'Identifiants invalides' });
    return;
  }

  const token = await createSessionForUser(user.id);
  sendAuthResponse(res, user, token);
}

async function register(req, res) {
  const db = await readDb();

  try {
    validateRegistrationPayload(req.body || {});
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
    return;
  }

  if (db.users.some((user) => normalizeEmail(user.email) === normalizeEmail(req.body.email))) {
    res.status(409).json({ success: false, message: 'Un compte existe deja avec cet email' });
    return;
  }

  const user = await createUser(req.body);
  const token = await createSessionForUser(user.id);

  sendAuthResponse(res, user, token, 201);
}

function forgotPassword(req, res) {
  res.json({ success: true, message: 'Si ce compte existe, un email de reinitialisation sera envoye.' });
}

async function logout(req, res) {
  await deleteSession(req.auth.session.token);
  res.json({ success: true });
}

module.exports = {
  forgotPassword,
  login,
  logout,
  register,
};
