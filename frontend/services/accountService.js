import { apiClient } from './apiClient.js';

export const accountService = {
  async getProfile() {
    const data = await apiClient.get('/pg/auth/profile');
    return data.user || data;
  },
  async updateProfile(profile) {
    const payload = {
      first_name: profile.firstName,
      last_name: profile.lastName,
      email: profile.email,
    };
    const data = await apiClient.put('/pg/auth/profile', payload);
    return data.user || profile;
  },
  async updateAddresses(addresses) {
    const data = await apiClient.put('/account/addresses', { addresses });
    return data.user || { addresses };
  },
  async changePassword({ oldPassword, newPassword }) {
    return apiClient.put('/pg/auth/password', { oldPassword, newPassword });
  },
};
