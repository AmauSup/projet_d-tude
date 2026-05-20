import { apiClient } from './apiClient.js';

export const orderService = {
  async list() {
    const data = await apiClient.get('/pg/orders');
    return data.orders || data;
  },
  async create(payload) {
    const data = await apiClient.post('/pg/orders', payload);
    return data.order || data;
  },
};
