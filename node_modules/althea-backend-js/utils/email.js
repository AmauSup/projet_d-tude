// backend/utils/email.js
// Mock d'envoi d'email pour confirmation et reset password

async function sendEmail({ to, subject, text, html }) {
  // En prod, brancher ici nodemailer ou un service SMTP/API
  console.log('[MOCK EMAIL]', { to, subject, text });
  return true;
}

module.exports = { sendEmail };
