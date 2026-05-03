
// Service d'authentification connecté au backend
export const authService = {
  // Connexion : envoie les identifiants au backend et récupère le token + rôle
  async login(credentials) {
    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      if (!response.ok) {
        let errorMsg = 'Erreur de connexion';
        let error = {};
        error = await response.json().catch(() => ({}));
        if (response.status === 401) {
          errorMsg = "Email ou mot de passe incorrect.";
        } else if (response.status === 500) {
          errorMsg = "Erreur serveur, veuillez réessayer.";
        } else if (error.message) {
          errorMsg = error.message;
        }
        throw new Error(errorMsg);
      }
      const data = await response.json();
      // On attend { token, user: { role, ... } }
      return {
        success: true,
        token: data.token,
        userRole: data.user?.role || 'customer',
        user: data.user,
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  // Inscription (à adapter selon backend)
  async register(payload) {
    try {
      const response = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur d\'inscription');
      }
      const data = await response.json();
      return { success: true, requiresEmailVerification: data.requiresEmailVerification, payload: data.user };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  // Mot de passe oublié
  async forgotPassword(email) {
    try {
      const response = await fetch('http://localhost:3001/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur');
      }
      return { success: true, email };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  // Déconnexion
  async logout() {
    try {
      await fetch('http://localhost:3001/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    return { success: true };
  },
};
