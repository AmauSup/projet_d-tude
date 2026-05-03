
import { apiClient } from './apiClient.js';

export const accountService = {
  async updateProfile(profile) {
    return await apiClient.put('/account/profile', profile);
  },
  async updateAddresses(addresses) {
    return await apiClient.put('/account/addresses', addresses);
  },
};
