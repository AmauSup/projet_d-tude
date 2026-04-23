const PRODUCT_ACTIONS = new Set(['priority', 'availability', 'featured']);

function isValidProductAction(action) {
  return PRODUCT_ACTIONS.has(action);
}

function toggleProductPriority(product, products) {
  const maxPriority = Math.max(0, ...products.map((item) => item.priorityRank || 0));
  product.priorityRank = product.priorityRank > 0 ? 0 : maxPriority + 1;
}

function toggleProductAvailability(product) {
  product.availableStock = product.availableStock > 0 ? 0 : 10;
}

function toggleProductFeatured(product, products) {
  const maxFeatured = Math.max(0, ...products.map((item) => item.featuredRank || 0));
  product.featuredRank = product.featuredRank > 0 ? 0 : maxFeatured + 1;
}

function applyProductAction(product, products, action) {
  if (action === 'priority') {
    toggleProductPriority(product, products);
  }

  if (action === 'availability') {
    toggleProductAvailability(product);
  }

  if (action === 'featured') {
    toggleProductFeatured(product, products);
  }
}

module.exports = {
  applyProductAction,
  isValidProductAction,
};
