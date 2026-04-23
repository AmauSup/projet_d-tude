import { apiClient } from './apiClient.js';

export const productService = {
  async list() {
    const payload = await apiClient.get('/products');
    return payload.products;
  },
  async getBySlug(slug) {
    const payload = await apiClient.get(`/products/${slug}`);
    return payload.product;
  },
};
