const { updateDb } = require('../data/store');

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function findUserByCredentials(users, email, password) {
  const normalizedEmail = normalizeEmail(email);

  return users.find((user) => (
    normalizeEmail(user.email) === normalizedEmail && user.password === password
  ));
}

function validatePassword(password) {
  return (
    String(password || '').length >= 8
    && /[A-Z]/.test(password)
    && /[a-z]/.test(password)
    && /\d/.test(password)
    && /[^A-Za-z0-9]/.test(password)
  );
}

function validateRegistrationPayload(payload) {
  const { firstName, lastName, email, password } = payload;

  if (!firstName || !lastName || !normalizeEmail(email) || !password) {
    throw new Error('Tous les champs obligatoires sont requis');
  }

  if (!validatePassword(password)) {
    throw new Error('Le mot de passe doit contenir 8 caracteres, une majuscule, une minuscule, un chiffre et un caractere special.');
  }
}

async function createUser(payload) {
  const user = {
    id: `user-${Date.now()}`,
    firstName: String(payload.firstName).trim(),
    lastName: String(payload.lastName).trim(),
    email: normalizeEmail(payload.email),
    password: payload.password,
    phone: '',
    company: String(payload.company || '').trim(),
    verified: true,
    role: 'customer',
    addresses: [],
    paymentMethods: [],
  };

  await updateDb((draft) => {
    draft.users.push(user);
  });

  return user;
}

module.exports = {
  createUser,
  findUserByCredentials,
  normalizeEmail,
  validateRegistrationPayload,
};
