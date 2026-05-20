const { readDb } = require('../data/store');
const { createSessionForUser, deleteSession } = require('../services/sessionService');
const userAuthService = require('../services/userAuthService');
const emailUtil = require('../utils/email');
const { sanitizeUser } = require('../utils/auth');

function sendAuthResponse(res, user, token, status = 200) {
  res.status(status).json({
    success: true,
    token,
    user: sanitizeUser(user),
    userRole: user.role,
  });
}

// Connexion — findUserByCredentials est maintenant async (bcrypt.compare)
async function login(req, res) {
  const db = await readDb();
  const user = await userAuthService.findUserByCredentials(db.users, req.body.email, req.body.password);

  if (!user) {
    res.status(401).json({ success: false, message: 'Identifiants invalides' });
    return;
  }
  if (!user.verified) {
    res.status(403).json({ success: false, message: 'Veuillez confirmer votre email avant de vous connecter.' });
    return;
  }

  const token = await createSessionForUser(user.id);
  sendAuthResponse(res, user, token);
}


// Inscription avec envoi d'email de confirmation
async function register(req, res) {
  const db = await readDb();

  try {
    userAuthService.validateRegistrationPayload(req.body || {});
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
    return;
  }

  if (db.users.some((user) => userAuthService.normalizeEmail(user.email) === userAuthService.normalizeEmail(req.body.email))) {
    res.status(409).json({ success: false, message: 'Un compte existe deja avec cet email' });
    return;
  }

  const { user, emailToken } = await userAuthService.createUser(req.body);
  // Envoi email de confirmation
  await emailUtil.sendEmail({
    to: user.email,
    subject: 'Confirmez votre email',
    text: `Cliquez ici pour confirmer: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/confirm-email?token=${emailToken}`,
  });
  res.status(201).json({ success: true, message: 'Inscription réussie. Vérifiez vos emails.', user: { ...user, password: undefined } });
}

// Endpoint de confirmation d'email
async function confirmEmail(req, res) {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ success: false, message: 'Token manquant' });
    const ok = await userAuthService.verifyEmailToken(token);
    if (!ok) return res.status(400).json({ success: false, message: 'Token invalide ou expiré' });
    res.json({ success: true, message: 'Email confirmé.' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

// Demande de reset password (envoi email)
async function requestResetPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email requis' });
    const result = await userAuthService.createResetPasswordToken(email);
    if (!result) return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
    await emailUtil.sendEmail({
      to: email,
      subject: 'Réinitialisation du mot de passe',
      text: `Cliquez ici pour réinitialiser: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${result.token}`,
    });
    res.json({ success: true, message: 'Email de réinitialisation envoyé.' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

// Reset password avec token
async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ success: false, message: 'Token et nouveau mot de passe requis' });
    const ok = await userAuthService.resetPasswordWithToken(token, newPassword);
    if (!ok) return res.status(400).json({ success: false, message: 'Token invalide ou expiré' });
    res.json({ success: true, message: 'Mot de passe réinitialisé.' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}


// Ancienne route, remplacée par requestResetPassword
function forgotPassword(req, res) {
  res.json({ success: true, message: 'Utilisez /auth/request-reset-password.' });
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
  confirmEmail,
  requestResetPassword,
  resetPassword,
};
