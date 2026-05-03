
import { apiClient } from './apiClient.js';

export const categoryService = {
  async list() {
    return await apiClient.get('/categories');
  },
};
