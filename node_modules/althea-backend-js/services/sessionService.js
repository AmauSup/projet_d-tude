const { updateDb } = require('../data/store');
const { createToken } = require('../utils/auth');

async function createSessionForUser(userId) {
  const token = createToken();

  await updateDb((draft) => {
    draft.sessions.push({ token, userId });
  });

  return token;
}

async function deleteSession(token) {
  await updateDb((draft) => {
    draft.sessions = draft.sessions.filter((session) => session.token !== token);
  });
}

module.exports = {
  createSessionForUser,
  deleteSession,
};
