import { apiClient } from './apiClient.js';

export const authService = {
  async login({ email, password }) {
    // Utilise la route PostgreSQL directe du backend
    const data = await apiClient.post('/pg/auth/login', { email, password });
    // En cas d'erreur, apiClient lance déjà une Error — on arrive ici uniquement si succès
    return {
      success: true,
      token: data.token,
      userRole: data.user?.is_admin ? 'admin' : 'customer',
      user: {
        ...data.user,
        role: data.user?.is_admin ? 'admin' : 'customer',
      },
    };
  },

  async register({ first_name, last_name, email, password }) {
    const data = await apiClient.post('/pg/auth/register', {
      first_name,
      last_name,
      email,
      password,
    });
    return {
      success: true,
      token: data.token,
      userRole: data.user?.is_admin ? 'admin' : 'customer',
      user: {
        ...data.user,
        role: data.user?.is_admin ? 'admin' : 'customer',
      },
    };
  },

  async forgotPassword(email) {
    await apiClient.post('/pg/auth/forgot-password', { email });
    return { success: true };
  },

  async resetPassword({ token, newPassword }) {
    await apiClient.post('/pg/auth/reset-password', { token, newPassword });
    return { success: true };
  },

  async logout() {
    try {
      await apiClient.post('/pg/auth/logout', {});
    } catch {
      // Stateless — on ignore les erreurs réseau au logout
    }
    return { success: true };
  },
};
