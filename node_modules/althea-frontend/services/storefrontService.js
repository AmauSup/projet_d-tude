import { apiClient } from './apiClient.js';

function normalizeProduct(p) {
  return {
    id: p.id,
    slug: p.slug || `product-${p.id}`,
    name: p.name || p.name_fr || '',
    description: p.description || p.description_fr || '',
    characteristics: p.characteristics || p.characteristics_fr || '',
    price: Number(p.price) || 0,
    availableStock: Number(p.stock) || 0,
    categoryId: p.category_id,
    categorySlug: p.category_slug || '',
    image: p.image || '',
    priorityRank: p.priority || 0,
    featuredRank: p.featured || 0,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  };
}

function normalizeCategory(c) {
  return {
    id: c.id,
    slug: c.slug || `category-${c.id}`,
    name: c.name || '',
    description: c.description || '',
    imageUrl: c.image_url || '',
    displayOrder: c.order_index ?? c.displayOrder ?? 0,
  };
}

export const storefrontService = {
  async getInitialData() {
    try {
      const data = await apiClient.get('/pg/storefront');
      return {
        products: (data.products || []).map(normalizeProduct),
        categories: (data.categories || []).map(normalizeCategory),
        homeContent: data.homeContent || { fixedMessage: '', carousel: [] },
      };
    } catch (pgErr) {
      console.warn('[storefront] PG indisponible, fallback db.json:', pgErr.message);
      const data = await apiClient.get('/storefront');
      return {
        products: (data.products || []).map(normalizeProduct),
        categories: (data.categories || []).map(normalizeCategory),
        homeContent: data.homeContent || { fixedMessage: '', carousel: [] },
      };
    }
  },

  async getProducts() {
    try {
      const data = await apiClient.get('/pg/products');
      return (data.products || []).map(normalizeProduct);
    } catch (pgErr) {
      console.warn('[products] PG indisponible, fallback db.json:', pgErr.message);
      const data = await apiClient.get('/products');
      return (data || []).map(normalizeProduct);
    }
  },
};
