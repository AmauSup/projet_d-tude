import { apiClient } from './apiClient.js';

export const adminService = {
  async getStats(period = '30d') {
    const data = await apiClient.get(`/pg/admin/stats?period=${period}`);
    return data.stats;
  },

  async listUsers() {
    const data = await apiClient.get('/pg/admin/users');
    return data.users || [];
  },

  async createUser(user) {
    const data = await apiClient.post('/pg/admin/users', user);
    return data.user;
  },

  async deleteUser(id) {
    await apiClient.patch(`/pg/admin/users/${id}/delete`, {});
    return true;
  },

  async listOrders() {
    const data = await apiClient.get('/pg/admin/orders');
    return data.orders || [];
  },

  async updateOrderStatus(id, status) {
    await apiClient.put(`/pg/admin/orders/${id}/status`, { status });
  },

  async listProducts() {
    const data = await apiClient.get('/pg/admin/products');
    return data.products || [];
  },

  async updateProduct(id, fields) {
    const data = await apiClient.put(`/pg/admin/products/${id}`, fields);
    return data.product;
  },

  async deleteProduct(id) {
    await apiClient.delete(`/pg/admin/products/${id}`);
    return true;
  },
};
