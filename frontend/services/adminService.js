import { apiClient } from './apiClient.js';

export const adminService = {
  async getStats({ products = [], orders = [] } = {}) {
    try {
      const payload = await apiClient.get('/admin/stats');
      return payload.stats;
    } catch {
      return {
        products: products.length,
        orders: orders.length,
        revenue: orders.reduce((sum, order) => sum + order.totalCents, 0),
      };
    }
  },
  async listOrders() {
    const payload = await apiClient.get('/admin/orders');
    return payload.orders;
  },
  async updateOrderStatus(orderId, status) {
    const payload = await apiClient.patch(`/admin/orders/${orderId}`, { status });
    return payload.order;
  },
  async toggleProductPriority(productId) {
    const payload = await apiClient.patch(`/admin/products/${productId}/priority`, {});
    return payload.product;
  },
  async toggleProductAvailability(productId) {
    const payload = await apiClient.patch(`/admin/products/${productId}/availability`, {});
    return payload.product;
  },
  async toggleFeatured(productId) {
    const payload = await apiClient.patch(`/admin/products/${productId}/featured`, {});
    return payload.product;
  },
  async updateCategoryOrder(categoryId, displayOrder) {
    const payload = await apiClient.patch(`/admin/categories/${categoryId}`, { displayOrder });
    return payload.category;
  },
  async updateHomeMessage(fixedMessage) {
    const payload = await apiClient.patch('/content/home/message', { fixedMessage });
    return payload.homeContent;
  },
  async moveCarouselSlide(slideId, direction) {
    const payload = await apiClient.patch('/content/home/carousel/reorder', { slideId, direction });
    return payload.homeContent;
  },
};
