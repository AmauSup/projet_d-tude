
import { apiClient } from './apiClient.js';

export const productService = {
  async list() {
    return await apiClient.get('/products');
  },
  async getBySlug(slug) {
    return await apiClient.get(`/products/${slug}`);
  },
};
