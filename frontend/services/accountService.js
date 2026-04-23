import { apiClient } from './apiClient.js';

export const accountService = {
  async getProfile() {
    const payload = await apiClient.get('/account/profile');
    return payload.user;
  },
  async getAddresses() {
    const payload = await apiClient.get('/account/addresses');
    return payload.addresses;
  },
  async updateProfile(profile) {
    const payload = await apiClient.put('/account/profile', profile);
    return payload.user;
  },
  async updateAddresses(addresses) {
    const payload = await apiClient.put('/account/addresses', { addresses });
    return payload.user;
  },
};
