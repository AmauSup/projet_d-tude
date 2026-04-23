const crypto = require('crypto');

function createToken() {
  return crypto.randomBytes(24).toString('hex');
}

function getBearerToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : '';
}

function sanitizeUser(user) {
  const { password, ...safe } = user;
  return safe;
}

module.exports = {
  createToken,
  getBearerToken,
  sanitizeUser,
};