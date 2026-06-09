import { apiClient } from './apiClient.js';

export const adminService = {
  async getStats(period = '30d') {
    const data = await apiClient.get(`/pg/admin/stats?period=${period}`);
    return data.stats;
  },

  // --- USERS ---
  async listUsers() {
    const data = await apiClient.get('/pg/admin/users');
    return data.users || [];
  },

  async createUser(user) {
    const data = await apiClient.post('/pg/admin/users', user);
    return data.user;
  },

  async updateUser(id, fields) {
    const data = await apiClient.put(`/pg/admin/users/${id}`, fields);
    return data.user;
  },

  async deleteUser(id) {
    await apiClient.patch(`/pg/admin/users/${id}/delete`, {});
    return true;
  },

  // --- ORDERS ---
  async listOrders() {
    const data = await apiClient.get('/pg/admin/orders');
    return data.orders || [];
  },

  async updateOrderStatus(id, status) {
    await apiClient.put(`/pg/admin/orders/${id}/status`, { status });
  },

  // --- PRODUCTS ---
  async listProducts() {
    const data = await apiClient.get('/pg/admin/products');
    return data.products || [];
  },

  async createProduct(fields) {
    const data = await apiClient.post('/pg/admin/products', fields);
    return data.product;
  },

  async updateProduct(id, fields) {
    const data = await apiClient.put(`/pg/admin/products/${id}`, fields);
    return data.product;
  },

  async deleteProduct(id) {
    await apiClient.delete(`/pg/admin/products/${id}`);
    return true;
  },

  // --- CATEGORIES ---
  async listCategories() {
    const data = await apiClient.get('/pg/admin/categories');
    return data.categories || [];
  },

  async createCategory(fields) {
    const data = await apiClient.post('/pg/admin/categories', fields);
    return data.category;
  },

  async updateCategory(id, fields) {
    await apiClient.put(`/pg/admin/categories/${id}`, fields);
    return true;
  },

  async deleteCategory(id) {
    await apiClient.delete(`/pg/admin/categories/${id}`);
    return true;
  },

  // --- HOMEPAGE / CAROUSEL ---
  async getHomepage() {
    const data = await apiClient.get('/pg/admin/homepage');
    return data.homepage || { fixed_message: '', carousel: [] };
  },

  async updateHomepage(fixed_message) {
    await apiClient.put('/pg/admin/homepage', { fixed_message });
    return true;
  },

  async createCarouselSlide(fields) {
    const data = await apiClient.post('/pg/admin/carousel', fields);
    return data.slide;
  },

  async updateCarouselSlide(id, fields) {
    await apiClient.put(`/pg/admin/carousel/${id}`, fields);
    return true;
  },

  async deleteCarouselSlide(id) {
    await apiClient.delete(`/pg/admin/carousel/${id}`);
    return true;
  },

  // --- SUPPORT MESSAGES ---
  async listContactMessages() {
    const data = await apiClient.get('/pg/admin/messages');
    return data.messages || [];
  },

  async updateMessageStatus(id, status, admin_reply = null) {
    await apiClient.patch(`/pg/admin/messages/${id}`, { status, admin_reply });
    return true;
  },

  // --- PAYMENTS / LOGS ---
  async listPayments() {
    const data = await apiClient.get('/pg/admin/payments');
    return data.payments || [];
  },

  async getLogs() {
    const data = await apiClient.get('/pg/admin/logs');
    return data.logs || [];
  },
};
