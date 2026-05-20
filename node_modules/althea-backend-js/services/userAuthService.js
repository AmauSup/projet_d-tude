'use strict';

const bcrypt = require('bcryptjs');
const crypto = require('node:crypto');
const { updateDb } = require('../data/store');

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

async function findUserByCredentials(users, email, password) {
  const normalizedEmail = normalizeEmail(email);
  const user = users.find((u) => normalizeEmail(u.email) === normalizedEmail);
  if (!user) return null;
  const valid = await bcrypt.compare(password, user.password);
  return valid ? user : null;
}

function validatePassword(password) {
  return (
    String(password || '').length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

function validateRegistrationPayload(payload) {
  const { firstName, lastName, email, password } = payload;

  if (!firstName || !lastName || !normalizeEmail(email) || !password) {
    throw new Error('Tous les champs obligatoires sont requis');
  }

  if (!validatePassword(password)) {
    throw new Error(
      'Le mot de passe doit contenir 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.',
    );
  }
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

async function createUser(payload) {
  const passwordHash = await bcrypt.hash(payload.password, 12);

  const user = {
    id: `user-${Date.now()}`,
    firstName: String(payload.firstName).trim(),
    lastName: String(payload.lastName).trim(),
    email: normalizeEmail(payload.email),
    password: passwordHash,
    phone: '',
    company: String(payload.company || '').trim(),
    verified: false,
    emailVerifiedAt: null,
    role: 'customer',
    addresses: [],
    paymentMethods: [],
  };

  const emailToken = generateToken();

  await updateDb((draft) => {
    draft.users.push(user);
    draft.emailTokens = draft.emailTokens || [];
    draft.emailTokens.push({
      userId: user.id,
      token: emailToken,
      expires: Date.now() + 1000 * 60 * 60 * 24,
    });
  });

  return { user, emailToken };
}

async function verifyEmailToken(token) {
  let verified = false;
  await updateDb((draft) => {
    draft.emailTokens = draft.emailTokens || [];
    const entry = draft.emailTokens.find((t) => t.token === token && t.expires > Date.now());
    if (entry) {
      const user = draft.users.find((u) => u.id === entry.userId);
      if (user) {
        user.verified = true;
        user.emailVerifiedAt = new Date().toISOString();
        verified = true;
      }
      draft.emailTokens = draft.emailTokens.filter((t) => t.token !== token);
    }
  });
  return verified;
}

async function createResetPasswordToken(email) {
  let userId = null;
  const token = generateToken();
  await updateDb((draft) => {
    draft.resetTokens = draft.resetTokens || [];
    const user = draft.users.find((u) => normalizeEmail(u.email) === normalizeEmail(email));
    if (user) {
      userId = user.id;
      // Expiration 30 minutes
      draft.resetTokens.push({ userId, token, expires: Date.now() + 1000 * 60 * 30 });
    }
  });
  return userId ? { userId, token } : null;
}

async function resetPasswordWithToken(token, newPassword) {
  if (!validatePassword(newPassword)) {
    throw new Error(
      'Le nouveau mot de passe doit contenir 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.',
    );
  }

  let success = false;
  const newHash = await bcrypt.hash(newPassword, 12);

  await updateDb((draft) => {
    draft.resetTokens = draft.resetTokens || [];
    const entry = draft.resetTokens.find((t) => t.token === token && t.expires > Date.now());
    if (entry) {
      const user = draft.users.find((u) => u.id === entry.userId);
      if (user) {
        user.password = newHash;
        success = true;
      }
      // Invalider le token après usage
      draft.resetTokens = draft.resetTokens.filter((t) => t.token !== token);
    }
  });
  return success;
}

module.exports = {
  createUser,
  findUserByCredentials,
  normalizeEmail,
  validateRegistrationPayload,
  verifyEmailToken,
  createResetPasswordToken,
  resetPasswordWithToken,
};
