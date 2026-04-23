const { sendJson } = require('../utils/http');
const { requireAuth } = require('../middlewares/requireAuth');
const { sanitizeUser } = require('../utils/auth');

const PROFILE_ROUTE = '/api/account/profile';

function isProfileRequest(req, pathname) {
  return req.method === 'GET' && pathname === PROFILE_ROUTE;
}

async function sendProfileResponse(req, res) {
  const auth = await requireAuth(req, res);
  if (!auth) {
    return true;
  }

  sendJson(res, 200, {
    success: true,
    user: sanitizeUser(auth.user),
  });

  return true;
}

async function handleAccountRoutes(req, res, { pathname }) {
  if (!isProfileRequest(req, pathname)) {
    return false;
  }

  return sendProfileResponse(req, res);
}

module.exports = { handleAccountRoutes };
