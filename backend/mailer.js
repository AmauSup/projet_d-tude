'use strict';

const nodemailer = require('nodemailer');

let _transporter = null;

async function getTransporter() {
  if (_transporter) return _transporter;

  // En prod : utiliser les variables d'env SMTP_*
  if (process.env.SMTP_HOST) {
    _transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.info('[MAILER] Transporter SMTP configuré via variables d\'env.');
    return _transporter;
  }

  // En dev : créer un compte de test Ethereal automatiquement
  const testAccount = await nodemailer.createTestAccount();
  _transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
  console.info('[MAILER] Compte Ethereal Email créé :', testAccount.user);
  return _transporter;
}

const FROM = process.env.MAIL_FROM || '"Althea Systems" <noreply@althea-systems.com>';

async function sendMail({ to, subject, html, text }) {
  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail({ from: FROM, to, subject, html, text });
    const preview = nodemailer.getTestMessageUrl(info);
    if (preview) {
      console.info(`[MAILER] Aperçu email (Ethereal) : ${preview}`);
    }
    return info;
  } catch (err) {
    console.error('[MAILER] Erreur envoi :', err.message);
  }
}

// --- Templates ---

async function sendWelcome(user) {
  await sendMail({
    to: user.email,
    subject: 'Bienvenue sur Althea Systems',
    html: `
      <h2>Bienvenue, ${user.first_name} !</h2>
      <p>Votre compte professionnel Althea Systems a été créé avec succès.</p>
      <p>Vous pouvez dès à présent commander du matériel médical certifié et suivre vos commandes depuis votre espace client.</p>
      <p>— L'équipe Althea Systems</p>
    `,
    text: `Bienvenue ${user.first_name} ! Votre compte Althea Systems a été créé.`,
  });
}

async function sendOrderConfirmation(user, order) {
  const itemsHtml = (order.items || [])
    .map((i) => `<li>${i.product_name || i.product_id} × ${i.quantity} — ${Number(i.line_total || 0).toFixed(2)} €</li>`)
    .join('');

  await sendMail({
    to: user.email,
    subject: `Confirmation de votre commande #${order.id}`,
    html: `
      <h2>Votre commande est confirmée</h2>
      <p>Bonjour ${user.first_name},</p>
      <p>Nous avons bien reçu votre commande <strong>#${order.id}</strong>.</p>
      <ul>${itemsHtml}</ul>
      <p><strong>Total TTC : ${Number(order.total_amount || 0).toFixed(2)} €</strong></p>
      <p>Vous recevrez un e-mail dès l'expédition.</p>
      <p>— L'équipe Althea Systems</p>
    `,
    text: `Commande #${order.id} confirmée. Total : ${Number(order.total_amount || 0).toFixed(2)} €`,
  });
}

async function sendPasswordReset(user, resetLink) {
  await sendMail({
    to: user.email,
    subject: 'Réinitialisation de votre mot de passe',
    html: `
      <h2>Réinitialisation de mot de passe</h2>
      <p>Bonjour ${user.first_name},</p>
      <p>Cliquez sur le lien ci-dessous pour définir un nouveau mot de passe (valable 1 heure) :</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <p>Si vous n'avez pas fait cette demande, ignorez cet e-mail.</p>
      <p>— L'équipe Althea Systems</p>
    `,
    text: `Lien de réinitialisation : ${resetLink}`,
  });
}

async function sendEmailVerification(user, verifyLink) {
  await sendMail({
    to: user.email,
    subject: 'Confirmez votre adresse e-mail — Althea Systems',
    html: `
      <h2>Bienvenue, ${user.first_name} !</h2>
      <p>Merci de vous être inscrit sur Althea Systems.</p>
      <p>Cliquez sur le lien ci-dessous pour confirmer votre adresse e-mail et activer votre compte (lien valable <strong>24 heures</strong>) :</p>
      <p><a href="${verifyLink}" style="background:#0284c7;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Confirmer mon adresse e-mail</a></p>
      <p>Ou copiez ce lien dans votre navigateur :<br>${verifyLink}</p>
      <p>Si vous n'avez pas créé de compte, ignorez cet e-mail.</p>
      <p>— L'équipe Althea Systems</p>
    `,
    text: `Confirmez votre compte Althea Systems en cliquant sur ce lien : ${verifyLink}`,
  });
}

async function sendAdminOtp(user, otp) {
  await sendMail({
    to: user.email,
    subject: 'Code de vérification administrateur',
    html: `
      <h2>Connexion administrateur — Code de vérification</h2>
      <p>Bonjour ${user.first_name},</p>
      <p>Votre code de vérification à usage unique est :</p>
      <h1 style="letter-spacing:8px;font-family:monospace;">${otp}</h1>
      <p>Ce code expire dans <strong>10 minutes</strong>.</p>
      <p>Si vous n'êtes pas à l'origine de cette connexion, contactez-nous immédiatement.</p>
    `,
    text: `Votre code 2FA admin : ${otp} (valable 10 minutes)`,
  });
}

async function sendAdminReply(to, subject, replyText) {
  await sendMail({
    to,
    subject: subject ? `Re: ${subject}` : 'Réponse de l\'équipe Althea Systems',
    html: `
      <h2>Réponse à votre demande de support</h2>
      <p>Bonjour,</p>
      <p>Notre équipe a répondu à votre message :</p>
      <blockquote style="border-left:4px solid #0284c7;margin:12px 0;padding:8px 16px;background:#f0f9ff;color:#0f172a;">
        ${replyText.replaceAll('\n', '<br>')}
      </blockquote>
      <p>Si vous avez d'autres questions, n'hésitez pas à nous recontacter.</p>
      <p>— L'équipe Althea Systems</p>
    `,
    text: replyText,
  });
}

module.exports = { sendWelcome, sendEmailVerification, sendOrderConfirmation, sendPasswordReset, sendAdminOtp, sendAdminReply };
