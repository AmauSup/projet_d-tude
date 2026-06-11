import { describe, it, expect } from 'vitest';
import {
  formatPrice,
  sortProductsForCategory,
  searchProducts,
  buildCartDetails,
  computeCartSummary,
  createOrderId,
} from '../utils/storefront.js';

// ─── formatPrice ─────────────────────────────────────────────────────────────
// On compare au rendu de Intl.NumberFormat plutôt qu'à une chaîne hardcodée
// pour éviter les variations de séparateur (U+00A0 vs U+202F) selon l'environnement.
const eurFmt = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });

describe('formatPrice', () => {
  it('formate 0 centimes', () => {
    expect(formatPrice(0)).toBe(eurFmt.format(0));
  });

  it('formate 100 centimes (1,00 €)', () => {
    expect(formatPrice(100)).toBe(eurFmt.format(1));
  });

  it('formate 99900 centimes (999,00 €)', () => {
    expect(formatPrice(99900)).toBe(eurFmt.format(999));
  });

  it('formate 150050 centimes avec séparateur de milliers', () => {
    expect(formatPrice(150050)).toBe(eurFmt.format(1500.5));
  });

  it('retourne une chaîne contenant le symbole €', () => {
    expect(formatPrice(500)).toContain('€');
  });
});

// ─── sortProductsForCategory ──────────────────────────────────────────────────

describe('sortProductsForCategory', () => {
  const products = [
    { id: 1, name: 'Echo', availableStock: 5, priorityRank: 0 },
    { id: 2, name: 'Alpha', availableStock: 0, priorityRank: 0 },
    { id: 3, name: 'Bravo', availableStock: 3, priorityRank: 2 },
    { id: 4, name: 'Charlie', availableStock: 1, priorityRank: 1 },
  ];

  it('place les produits disponibles avant les indisponibles', () => {
    const sorted = sortProductsForCategory(products);
    const firstUnavailableIndex = sorted.findIndex((p) => p.availableStock <= 0);
    sorted.slice(0, firstUnavailableIndex).forEach((p) => {
      expect(p.availableStock).toBeGreaterThan(0);
    });
  });

  it('trie les produits prioritaires par rang croissant', () => {
    const sorted = sortProductsForCategory(products);
    const withPriority = sorted.filter((p) => p.priorityRank > 0 && p.availableStock > 0);
    for (let i = 1; i < withPriority.length; i++) {
      expect(withPriority[i].priorityRank).toBeGreaterThanOrEqual(withPriority[i - 1].priorityRank);
    }
  });

  it('ne modifie pas le tableau source', () => {
    const copy = [...products];
    sortProductsForCategory(products);
    expect(products).toEqual(copy);
  });
});

// ─── searchProducts ───────────────────────────────────────────────────────────

const sampleProducts = [
  {
    id: 1,
    name: 'Stéthoscope cardio',
    description: 'Idéal pour la cardiologie',
    technicalFeatures: ['fréquence cardiaque', 'acoustique'],
    tags: ['cardio', 'médecin'],
    categoryId: 'cat-1',
    priceCents: 15000,
    availableStock: 10,
    relevanceScore: 99,
  },
  {
    id: 2,
    name: 'Tensiomètre numérique',
    description: 'Mesure précise de la pression artérielle',
    technicalFeatures: ['pression artérielle', 'numérique'],
    tags: ['tension', 'hypertension'],
    categoryId: 'cat-2',
    priceCents: 8000,
    availableStock: 0,
    relevanceScore: 99,
  },
  {
    id: 3,
    name: 'Oxymètre de pouls',
    description: 'Mesure de la saturation en oxygène',
    technicalFeatures: ['SpO2', 'fréquence cardiaque'],
    tags: ['oxygène', 'saturation'],
    categoryId: 'cat-1',
    priceCents: 3500,
    availableStock: 5,
    relevanceScore: 99,
  },
];

describe('searchProducts', () => {
  it('retourne tous les produits sans critères', () => {
    const results = searchProducts(sampleProducts, {});
    expect(results).toHaveLength(3);
  });

  it('filtre par requête textuelle', () => {
    const results = searchProducts(sampleProducts, { query: 'stéthoscope' });
    expect(results.some((p) => p.id === 1)).toBe(true);
  });

  it('filtre par catégorie', () => {
    const results = searchProducts(sampleProducts, { categoryId: 'cat-1' });
    expect(results.every((p) => p.categoryId === 'cat-1')).toBe(true);
    expect(results).toHaveLength(2);
  });

  it('filtre les produits indisponibles', () => {
    const results = searchProducts(sampleProducts, { availableOnly: true });
    expect(results.every((p) => p.availableStock > 0)).toBe(true);
  });

  it('filtre par prix minimum (100 €)', () => {
    const results = searchProducts(sampleProducts, { minPrice: '100' });
    expect(results.every((p) => p.priceCents >= 10000)).toBe(true);
  });

  it('filtre par prix maximum (80 €)', () => {
    const results = searchProducts(sampleProducts, { maxPrice: '80' });
    expect(results.every((p) => p.priceCents <= 8000)).toBe(true);
  });

  it('tolère les fautes de frappe légères (fuzzy)', () => {
    const results = searchProducts(sampleProducts, { query: 'stetoscope' });
    expect(results.length).toBeGreaterThan(0);
  });
});

// ─── buildCartDetails ─────────────────────────────────────────────────────────

describe('buildCartDetails', () => {
  it('associe les produits aux articles du panier', () => {
    const cartItems = [{ productId: 1, quantity: 2 }];
    const details = buildCartDetails(cartItems, sampleProducts);
    expect(details).toHaveLength(1);
    expect(details[0].product.name).toBe('Stéthoscope cardio');
    expect(details[0].quantity).toBe(2);
  });

  it('ignore les articles sans produit correspondant', () => {
    const cartItems = [{ productId: 999, quantity: 1 }];
    const details = buildCartDetails(cartItems, sampleProducts);
    expect(details).toHaveLength(0);
  });

  it('marque comme indisponible les produits sans stock', () => {
    const cartItems = [{ productId: 2, quantity: 1 }];
    const details = buildCartDetails(cartItems, sampleProducts);
    expect(details[0].isUnavailable).toBe(true);
    expect(details[0].lineTotalCents).toBe(0);
  });

  it('calcule correctement le total de ligne', () => {
    const cartItems = [{ productId: 3, quantity: 3 }];
    const details = buildCartDetails(cartItems, sampleProducts);
    expect(details[0].lineTotalCents).toBe(3500 * 3);
  });
});

// ─── computeCartSummary ───────────────────────────────────────────────────────

describe('computeCartSummary', () => {
  it('retourne des zéros pour un panier vide', () => {
    const summary = computeCartSummary([]);
    expect(summary.subtotalCents).toBe(0);
    expect(summary.totalCents).toBe(0);
    expect(summary.taxCents).toBe(0);
    expect(summary.promotionCents).toBe(0);
  });

  it('calcule la TVA à 20%', () => {
    const cartDetails = [{ lineTotalCents: 10000, isUnavailable: false }];
    const summary = computeCartSummary(cartDetails);
    expect(summary.subtotalCents).toBe(10000);
    expect(summary.taxCents).toBe(2000);
    expect(summary.totalCents).toBe(12000);
  });

  it('applique la remise de 5% au-dessus de 3000 €', () => {
    const cartDetails = [{ lineTotalCents: 300000, isUnavailable: false }];
    const summary = computeCartSummary(cartDetails);
    expect(summary.promotionCents).toBe(15000);
    expect(summary.subtotalCents).toBe(300000);
  });

  it('compte les produits indisponibles', () => {
    const cartDetails = [
      { lineTotalCents: 5000, isUnavailable: false },
      { lineTotalCents: 0, isUnavailable: true },
    ];
    const summary = computeCartSummary(cartDetails);
    expect(summary.unavailableCount).toBe(1);
  });
});

// ─── createOrderId ────────────────────────────────────────────────────────────

describe('createOrderId', () => {
  it('génère un identifiant au format CMD-2026-XXXXXX', () => {
    const id = createOrderId();
    expect(id).toMatch(/^CMD-2026-\d{6}$/);
  });

  it('retourne une chaîne commençant par CMD-2026-', () => {
    const id = createOrderId();
    expect(typeof id).toBe('string');
    expect(id.startsWith('CMD-2026-')).toBe(true);
  });
});
