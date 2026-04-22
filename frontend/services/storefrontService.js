import { apiClient } from './apiClient.js';

export const storefrontService = {
  async getInitialData() {
    const payload = await apiClient.get('/storefront');
    return {
      homeContent: payload.homeContent,
      categories: payload.categories,
      products: payload.products,
    };
  },
};
