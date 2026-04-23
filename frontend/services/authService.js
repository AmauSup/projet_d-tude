import { apiClient } from './apiClient.js';

export const authService = {
  login(credentials) {
    return apiClient.post('/auth/login', credentials);
  },
  register(payload) {
    return apiClient.post('/auth/register', payload);
  },
  forgotPassword(email) {
    return apiClient.post('/auth/forgot-password', { email });
  },
  logout() {
    return apiClient.post('/auth/logout', {});
  },
};
