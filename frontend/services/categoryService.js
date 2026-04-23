import { apiClient } from './apiClient.js';

export const categoryService = {
  async list() {
    const payload = await apiClient.get('/categories');
    return payload.categories;
  },
};
