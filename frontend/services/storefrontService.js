import { apiClient } from './apiClient.js';

// Convertit la valeur du champ "image" en URL string utilisable par <img src>.
// Le champ image peut arriver du backend sous plusieurs formes :
//   - string brute : "/images/produit.webp"
//   - string JSON encodée : '{"url":"/images/produit.webp"}'
//   - objet : { url: "...", src: "...", href: "...", path: "..." }
// Paramètres :
//   img (any) — valeur brute du champ image
// Retourne :
//   (string) — URL de l'image, ou '' si introuvable
function toImageUrl(img) {
  if (!img) return '';
  if (typeof img === 'string') {
    // Si la string commence par '{', on tente de la parser comme JSON
    if (img.trimStart().startsWith('{')) {
      try { return toImageUrl(JSON.parse(img)); } catch { /* fall through */ }
    }
    return img;
  }
  // Objet : on cherche les propriétés les plus courantes dans l'ordre de priorité
  if (typeof img === 'object') return img.url || img.src || img.href || img.path || '';
  return '';
}

// Normalise un produit brut (tel que renvoyé par le backend PostgreSQL) en objet
// uniforme utilisé partout dans le frontend.
// Cette fonction gère les incohérences de nommage entre l'API et l'UI
// (snake_case → camelCase, champs manquants → valeurs par défaut).
// Paramètres :
//   p (object) — produit brut de l'API (colonnes SQL telles quelles)
// Retourne :
//   (object) — produit normalisé avec les champs attendus par les composants React
function normalizeProduct(p) {
  // description : supporte la colonne française ou générique
  const description = p.description || p.description_fr || '';
  // characteristics : liste de specs techniques, séparée par \n ou ;
  const characteristics = p.characteristics || p.characteristics_fr || '';
  // technicalFeatures : tableau de strings, une ligne = une spec
  const technicalFeatures = characteristics
    ? characteristics.split(/[\n;]/).map((s) => s.trim()).filter(Boolean)
    : [];

  // images : tableau d'URLs. Priorité au tableau existant, sinon image unique.
  let images;
  if (p.images && Array.isArray(p.images)) {
    images = p.images.map(toImageUrl).filter(Boolean);
  } else if (p.image) {
    const url = toImageUrl(p.image);
    images = url ? [url] : [];
  } else {
    images = [];
  }

  // priceCents : prix converti en centimes pour éviter les erreurs d'arrondi
  const priceCents = Math.round(Number(p.price || p.price_cents || 0) * 100);

  return {
    id: p.id,
    slug: p.slug || `product-${p.id}`,          // slug URL-friendly (fallback auto)
    name: p.name || p.name_fr || '',
    description,
    shortDescription: description.slice(0, 140) || '', // Extrait pour les cards
    characteristics,
    technicalFeatures,
    tags: Array.isArray(p.tags) ? p.tags : [],
    price: Number(p.price) || 0,                // Prix en euros (float)
    priceCents,                                  // Prix en centimes (int)
    availableStock: Number(p.stock) || 0,
    categoryId: p.category_id,
    categorySlug: p.category_slug || '',
    image: toImageUrl(p.image),                  // Image principale (string)
    images,                                      // Toutes les images (tableau)
    priorityRank: Number(p.priority) || 0,       // Ordre dans la liste prioritaire
    featuredRank: Number(p.featured) || 0,       // Rang dans la section "à la une"
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  };
}

// Normalise une slide de carrousel telle que renvoyée par le backend.
// Gère les deux formes de nommage (snake_case API vs camelCase frontend).
// Paramètres :
//   s (object) — slide brute (colonnes SQL)
// Retourne :
//   (object) — slide normalisée pour le composant Carousel
function normalizeCarouselSlide(s) {
  return {
    id: String(s.id),                                        // Converti en string pour les keys React
    title: s.title || '',
    text: s.subtitle || s.text || '',                        // "subtitle" en BDD, "text" en frontend
    badge: s.badge || '',                                    // Pastille (ex: "Nouveau")
    imageUrl: s.image_url || s.imageUrl || '',
    ctaLabel: s.cta_label || s.ctaLabel || 'Voir la catégorie', // Texte du bouton
    categorySlug: s.link_url || s.categorySlug || '',        // Destination du CTA
    orderIndex: Number(s.order_index ?? s.orderIndex ?? 0),  // Position dans le carrousel
  };
}

// Normalise une catégorie brute pour l'affichage dans le frontend.
// Paramètres :
//   c (object) — catégorie brute de l'API
// Retourne :
//   (object) — catégorie normalisée pour les composants de navigation
function normalizeCategory(c) {
  return {
    id: c.id,
    slug: c.slug || `category-${c.id}`,
    name: c.name || '',
    description: c.description || '',
    imageUrl: toImageUrl(c.image_url),
    displayOrder: c.order_index ?? c.displayOrder ?? 0, // Ordre d'affichage dans la navigation
  };
}

// Service storefront — données publiques accessibles sans authentification.
export const storefrontService = {

  // Charge toutes les données nécessaires à la page d'accueil en un seul appel.
  // Tente d'abord PostgreSQL (/pg/storefront), puis bascule sur l'ancien endpoint
  // JSON (/storefront) si PG est indisponible (fallback de secours).
  // Paramètres :
  //   locale (string) — code langue (ex: 'fr', 'en'). Par défaut 'fr'.
  // Retourne :
  //   { products, categories, homeContent: { fixedMessage, carousel } }
  //   Tous les tableaux sont normalisés via les fonctions ci-dessus.
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

  // Charge uniquement la liste des produits (sans le reste du storefront).
  // Utilisé pour recharger les produits sans recharger le carrousel ou les catégories.
  // Paramètres :
  //   locale (string) — code langue. Par défaut 'fr'.
  // Retourne :
  //   (array) — tableau de produits normalisés
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
