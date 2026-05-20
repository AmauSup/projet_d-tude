import { apiClient } from './apiClient.js';

export const adminService = {
  async getStats() {
    const data = await apiClient.get('/pg/admin/stats');
    return data.stats || data;
  },

  // --- PRODUITS ---
  async listProducts() {
    const data = await apiClient.get('/pg/admin/products');
    return data.products || data;
  },
  async createProduct(product) {
    const data = await apiClient.post('/pg/admin/products', product);
    return data.product || data;
  },
  async updateProduct(id, product) {
    const data = await apiClient.put(`/pg/admin/products/${id}`, product);
    return data.product || product;
  },
  async deleteProduct(id) {
    return apiClient.patch(`/admin/products/${id}/delete`, {});
  },

  // --- COMMANDES ---
  async listOrders() {
    const data = await apiClient.get('/pg/admin/orders');
    return data.orders || data;
  },
  async getOrder(id) {
    const data = await apiClient.get(`/pg/admin/orders/${id}`);
    return data.order || data;
  },
  async updateOrderStatus(id, status) {
    const data = await apiClient.put(`/pg/admin/orders/${id}/status`, { status });
    return data.order || { id, status };
  },

  // --- UTILISATEURS ---
  async listUsers() {
    const data = await apiClient.get('/pg/admin/users');
    return data.users || data;
  },
  async deleteUser(id) {
    return apiClient.patch(`/pg/admin/users/${id}/delete`, {});
  },

  // --- MESSAGES CONTACT ---
  async listMessages() {
    const data = await apiClient.get('/pg/admin/messages');
    return data.messages || data;
  },
  async updateMessageStatus(id, status) {
    return apiClient.patch(`/pg/admin/messages/${id}`, { status });
  },
};
