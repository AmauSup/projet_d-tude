import { apiClient } from './apiClient.js';

export const storefrontService = {
  async getInitialData() {
    return await apiClient.get('/storefront');
  },

  // Charge tous les produits publics depuis la BDD
  async getProducts() {
    return await apiClient.get('/products');
  },
};
