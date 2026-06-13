'use strict';

const nodemailer = require('nodemailer');

// Instance du transporteur Nodemailer, mise en cache après la première initialisation.
// null au démarrage — initialisée au premier envoi d'e-mail via getTransporter().
// Cette variable persiste en mémoire tant que le serveur est en cours d'exécution,
// ce qui évite de créer un nouveau transporteur à chaque envoi.
let _transporter = null;

// Retourne le transporteur SMTP configuré, en le créant s'il n'existe pas encore.
// En production  : utilise les variables d'env SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS.
// En développement : crée un compte Ethereal jetable (emails capturés, jamais envoyés).
// Retourne : objet Nodemailer Transporter prêt à envoyer des e-mails.
async function getTransporter() {
  if (_transporter) return _transporter;

  // En prod : utiliser les variables d'env SMTP_*
  if (process.env.SMTP_HOST) {
    _transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,        // Adresse du serveur SMTP (ex: smtp.sendgrid.net)
      port: Number(process.env.SMTP_PORT) || 587, // Port SMTP (587 = TLS, 465 = SSL)
      secure: process.env.SMTP_SECURE === 'true', // true = SSL direct, false = STARTTLS
      auth: {
        user: process.env.SMTP_USER,      // Login du compte SMTP
        pass: process.env.SMTP_PASS,      // Mot de passe du compte SMTP
      },
    });
    console.info('[MAILER] Transporter SMTP configuré via variables d\'env.');
    return _transporter;
  }

  // En dev : créer un compte de test Ethereal automatiquement
  // Ethereal capte les e-mails et génère une URL de prévisualisation, sans rien envoyer.
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

// Adresse expéditeur affichée dans le champ "De:" de tous les e-mails.
// Lue depuis la variable d'env MAIL_FROM, sinon utilise l'adresse par défaut.
const FROM = process.env.MAIL_FROM || '"Althea Systems" <noreply@althea-systems.com>';

// Envoie un e-mail via le transporteur SMTP configuré.
// Paramètres :
//   to      (string) — adresse e-mail du destinataire
//   subject (string) — objet de l'e-mail
//   html    (string) — corps HTML de l'e-mail
//   text    (string) — corps texte brut (fallback pour les clients sans HTML)
// Retourne : objet info Nodemailer (contient l'ID du message, l'URL Ethereal en dev, etc.)
// En cas d'erreur : l'exception est attrapée et loguée sans relancer (envoi silencieux).
async function sendMail({ to, subject, html, text }) {
  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail({ from: FROM, to, subject, html, text });
    // getTestMessageUrl retourne une URL de prévisualisation Ethereal (null en prod)
    const preview = nodemailer.getTestMessageUrl(info);
    if (preview) {
      console.info(`[MAILER] Aperçu email (Ethereal) : ${preview}`);
    }
    return info;
  } catch (err) {
    console.error('[MAILER] Erreur envoi :', err.message);
  }
}

// ── TEMPLATES E-MAIL ──────────────────────────────────────────────────────────
// Chaque fonction ci-dessous est un template métier : elle construit le contenu
// de l'e-mail (sujet + HTML + texte) et délègue l'envoi à sendMail().

// Envoie un e-mail de bienvenue après la création d'un compte.
// Paramètres :
//   user (object) — { email, first_name } — destinataire et prénom affiché
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

// Envoie la confirmation d'une commande avec le détail des articles et le total.
// Paramètres :
//   user  (object) — { email, first_name } — client destinataire
//   order (object) — { id, items, total_amount } — commande passée
//     order.items[].product_name (string) — nom du produit
//     order.items[].quantity     (number) — quantité commandée
//     order.items[].line_total   (number) — sous-total de la ligne en euros
async function sendOrderConfirmation(user, order) {
  // Construit les lignes HTML de la liste d'articles (<li> par produit)
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

// Envoie un lien de réinitialisation de mot de passe (valable 1 heure).
// Paramètres :
//   user      (object) — { email, first_name } — utilisateur demandeur
//   resetLink (string) — URL complète avec le token de reset (ex: http://.../#/reset-password?token=xxx)
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

// Envoie un e-mail de vérification d'adresse après l'inscription.
// Paramètres :
//   user       (object) — { email, first_name } — nouvel utilisateur
//   verifyLink (string) — URL de confirmation contenant le token de vérification (valable 24h)
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

// Envoie le code OTP (One-Time Password) pour la validation 2FA des administrateurs.
// Déclenché lors de la connexion d'un compte marqué is_admin=true.
// Paramètres :
//   user (object) — { email, first_name } — admin se connectant
//   otp  (string) — code à 6 chiffres valable 10 minutes
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

// Envoie la réponse d'un admin à un message de contact (page support).
// Appelé depuis PATCH /api/pg/admin/messages/:id lorsque le statut passe à "replied".
// Paramètres :
//   to        (string) — adresse e-mail du client ayant envoyé le message
//   subject   (string) — objet du message original (utilisé pour le "Re: ...")
//   replyText (string) — texte de la réponse saisie par l'admin dans l'interface
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
