import { apiClient } from './apiClient.js';

export const orderService = {
  async list() {
    const payload = await apiClient.get('/orders');
    return payload.orders;
  },
  async create(orderPayload) {
    const payload = await apiClient.post('/orders', orderPayload);
    return payload.order;
  },
};
