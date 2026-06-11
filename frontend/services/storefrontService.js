import { apiClient } from './apiClient.js';

function toImageUrl(img) {
  if (!img) return '';
  if (typeof img === 'string') {
    if (img.trimStart().startsWith('{')) {
      try { return toImageUrl(JSON.parse(img)); } catch { /* fall through */ }
    }
    return img;
  }
  if (typeof img === 'object') return img.url || img.src || img.href || img.path || '';
  return '';
}

function normalizeProduct(p) {
  const description = p.description || p.description_fr || '';
  const characteristics = p.characteristics || p.characteristics_fr || '';
  const technicalFeatures = characteristics
    ? characteristics.split(/[\n;]/).map((s) => s.trim()).filter(Boolean)
    : [];
  let images;
  if (p.images && Array.isArray(p.images)) {
    images = p.images.map(toImageUrl).filter(Boolean);
  } else if (p.image) {
    const url = toImageUrl(p.image);
    images = url ? [url] : [];
  } else {
    images = [];
  }
  const priceCents = Math.round(Number(p.price || p.price_cents || 0) * 100);

  return {
    id: p.id,
    slug: p.slug || `product-${p.id}`,
    name: p.name || p.name_fr || '',
    description,
    shortDescription: description.slice(0, 140) || '',
    characteristics,
    technicalFeatures,
    tags: Array.isArray(p.tags) ? p.tags : [],
    price: Number(p.price) || 0,
    priceCents,
    availableStock: Number(p.stock) || 0,
    categoryId: p.category_id,
    categorySlug: p.category_slug || '',
    image: toImageUrl(p.image),
    images,
    priorityRank: Number(p.priority) || 0,
    featuredRank: Number(p.featured) || 0,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  };
}

function normalizeCarouselSlide(s) {
  return {
    id: String(s.id),
    title: s.title || '',
    text: s.subtitle || s.text || '',
    badge: s.badge || '',
    imageUrl: s.image_url || s.imageUrl || '',
    ctaLabel: s.cta_label || s.ctaLabel || 'Voir la catégorie',
    categorySlug: s.link_url || s.categorySlug || '',
    orderIndex: Number(s.order_index ?? s.orderIndex ?? 0),
  };
}

function normalizeCategory(c) {
  return {
    id: c.id,
    slug: c.slug || `category-${c.id}`,
    name: c.name || '',
    description: c.description || '',
    imageUrl: toImageUrl(c.image_url),
    displayOrder: c.order_index ?? c.displayOrder ?? 0,
  };
}

export const storefrontService = {
  async getInitialData(locale = 'fr') {
    try {
      const data = await apiClient.get(`/pg/storefront?locale=${encodeURIComponent(locale)}`);
      return {
        products: (data.products || []).map(normalizeProduct),
        categories: (data.categories || []).map(normalizeCategory),
        homeContent: {
          fixedMessage: data.homeContent?.fixedMessage || '',
          carousel: (data.homeContent?.carousel || []).map(normalizeCarouselSlide),
        },
      };
    } catch (pgErr) {
      console.warn('[storefront] PG indisponible, fallback db.json:', pgErr.message);
      const data = await apiClient.get('/storefront');
      return {
        products: (data.products || []).map(normalizeProduct),
        categories: (data.categories || []).map(normalizeCategory),
        homeContent: {
          fixedMessage: data.homeContent?.fixedMessage || '',
          carousel: (data.homeContent?.carousel || []).map(normalizeCarouselSlide),
        },
      };
    }
  },

  async getProducts(locale = 'fr') {
    try {
      const data = await apiClient.get(`/pg/products?locale=${encodeURIComponent(locale)}`);
      return (data.products || []).map(normalizeProduct);
    } catch (pgErr) {
      console.warn('[products] PG indisponible, fallback db.json:', pgErr.message);
      const data = await apiClient.get('/products');
      return (data || []).map(normalizeProduct);
    }
  },
};
