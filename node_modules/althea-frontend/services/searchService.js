import { searchProducts } from '../utils/storefront.js';

const wait = (ms = 80) => new Promise((resolve) => setTimeout(resolve, ms));

export const searchService = {
  async search(products, filters) {
    await wait();
    // Backend hook: call search API / search engine
    return searchProducts(products, filters);
  },
};
