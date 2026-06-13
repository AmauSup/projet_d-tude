import { apiClient, persistAuthToken } from './apiClient.js';

// Service d'authentification — regroupe toutes les actions liées à la session utilisateur.
// Chaque méthode envoie une requête au backend (/pg/auth/*) et gère le stockage du JWT.
// Le token est sauvegardé via persistAuthToken() après connexion ou inscription réussie.
export const authService = {

  // Envoie les identifiants et reçoit un JWT si la connexion réussit.
  // Si le compte est admin, le backend renvoie requires_2fa=true (pas encore de token)
  // et attend la validation OTP via verify2fa().
  // Paramètres :
  //   email      (string)  — adresse e-mail du compte
  //   password   (string)  — mot de passe en clair (le hash est fait côté serveur)
  //   rememberMe (boolean) — si true → localStorage (persistant), si false → sessionStorage (onglet)
  // Retourne :
  //   { success, requires_2fa, user_id, rememberMe } si 2FA requis
  //   { success, token, user, userRole }             sinon
  async login({ email, password, rememberMe = true }) {
    const data = await apiClient.post('/pg/auth/login', { email, password });
    // Admin → 2FA requis, pas encore de token
    if (data.requires_2fa) {
      return { success: true, requires_2fa: true, user_id: data.user_id, rememberMe };
    }
    if (data.token) {
      persistAuthToken(data.token, rememberMe);
    }
    return {
      success: true,
      token: data.token,
      user: data.user,
      // userRole : déduit du flag is_admin si le champ role n'est pas présent
      userRole: data.user?.role || (data.user?.is_admin ? 'admin' : 'customer'),
    };
  },

  // Valide le code OTP reçu par e-mail lors de la connexion admin (deuxième facteur).
  // Appelé uniquement si login() a retourné requires_2fa=true.
  // Paramètres :
  //   user_id    (number)  — identifiant de l'admin (renvoyé par login())
  //   otp        (string)  — code à 6 chiffres saisi par l'admin
  //   rememberMe (boolean) — hérité du paramètre de login()
  // Retourne :
  //   { success, token, user, userRole: 'admin' }
  async verify2fa({ user_id, otp, rememberMe = true }) {
    const data = await apiClient.post('/pg/auth/verify-2fa', { user_id, otp });
    if (data.token) {
      persistAuthToken(data.token, rememberMe);
    }
    return {
      success: true,
      token: data.token,
      user: data.user,
      userRole: 'admin',
    };
  },

  // Crée un nouveau compte utilisateur et connecte automatiquement l'utilisateur.
  // Si le serveur est configuré pour exiger une vérification e-mail (requires_confirmation),
  // le token n'est pas encore valide et l'utilisateur doit confirmer son adresse.
  // Paramètres :
  //   firstName (string) — prénom
  //   lastName  (string) — nom de famille
  //   email     (string) — adresse e-mail (doit être unique en base)
  //   password  (string) — mot de passe en clair (hashé côté backend avec bcrypt)
  // Retourne :
  //   { success, token, user, requires_confirmation }
  async register({ firstName, lastName, email, password }) {
    const data = await apiClient.post('/pg/auth/register', {
      first_name: firstName,
      last_name: lastName,
      email,
      password,
    });
    if (data.token) {
      persistAuthToken(data.token);
    }
    return {
      success: true,
      token: data.token,
      user: data.user,
      // requires_confirmation : true si un e-mail de vérification a été envoyé
      requires_confirmation: data.requires_confirmation || false,
    };
  },

  // Renvoi l'e-mail de vérification pour un compte non encore confirmé.
  // Utilisé depuis la page ResendVerification.
  // Paramètres :
  //   email (string) — adresse e-mail du compte à confirmer
  // Retourne :
  //   { success: true }
  async resendVerification(email) {
    await apiClient.post('/pg/auth/resend-verification', { email });
    return { success: true };
  },

  // Déclenche l'envoi d'un e-mail de réinitialisation de mot de passe.
  // Le backend génère un token unique, l'enregistre en base et envoie le lien par e-mail.
  // Paramètres :
  //   email (string) — adresse e-mail du compte
  // Retourne :
  //   { success: true } (même si l'e-mail n'existe pas, pour ne pas divulguer l'existence du compte)
  async forgotPassword(email) {
    await apiClient.post('/pg/auth/request-reset-password', { email });
    return { success: true };
  },

  // Définit un nouveau mot de passe après avoir cliqué sur le lien reçu par e-mail.
  // Le token est lu depuis l'URL (?token=...) et transmis au backend pour vérification.
  // Paramètres :
  //   token       (string) — token de réinitialisation extrait de l'URL
  //   newPassword (string) — nouveau mot de passe en clair (hashé côté backend)
  // Retourne :
  //   { success: true }
  async resetPassword({ token, newPassword }) {
    await apiClient.post('/pg/auth/reset-password', { token, newPassword });
    return { success: true };
  },

  // Récupère les informations du profil de l'utilisateur actuellement connecté.
  // Requiert un JWT valide dans le stockage local (envoyé automatiquement par apiClient).
  // Retourne :
  //   user (object) — { id, email, first_name, last_name, is_admin, ... }
  async getProfile() {
    const data = await apiClient.get('/pg/auth/profile');
    return data.user;
  },

  // Déconnecte l'utilisateur : invalide la session côté serveur et efface le token local.
  // Le bloc finally garantit que le token est supprimé même si la requête serveur échoue.
  // Retourne :
  //   { success: true }
  async logout() {
    try {
      await apiClient.post('/pg/auth/logout', {});
    } finally {
      // persistAuthToken(null) efface le token de localStorage ET sessionStorage
      persistAuthToken(null);
    }
    return { success: true };
  },
};
