import { apiClient, persistAuthToken } from './apiClient.js';

export const authService = {
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
      userRole: data.user?.role || (data.user?.is_admin ? 'admin' : 'customer'),
    };
  },

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
      requires_confirmation: data.requires_confirmation || false,
    };
  },

  async resendVerification(email) {
    await apiClient.post('/pg/auth/resend-verification', { email });
    return { success: true };
  },

  async forgotPassword(email) {
    await apiClient.post('/pg/auth/request-reset-password', { email });
    return { success: true };
  },

  async resetPassword({ token, newPassword }) {
    await apiClient.post('/pg/auth/reset-password', { token, newPassword });
    return { success: true };
  },

  async getProfile() {
    const data = await apiClient.get('/pg/auth/profile');
    return data.user;
  },

  async logout() {
    try {
      await apiClient.post('/pg/auth/logout', {});
    } finally {
      persistAuthToken(null);
    }
    return { success: true };
  },
};
