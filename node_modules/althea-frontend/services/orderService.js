
import { apiClient } from './apiClient.js';

export const orderService = {
  async list() {
    return await apiClient.get('/orders');
  },
};
