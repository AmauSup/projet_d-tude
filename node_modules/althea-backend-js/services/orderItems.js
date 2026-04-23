function normalizeItems(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => ({
      productId: String(item.productId || ''),
      quantity: Number(item.quantity || 0),
    }))
    .filter((item) => item.productId && Number.isInteger(item.quantity) && item.quantity > 0);
}

function findUnavailableItem(items, products) {
  return items.find((item) => {
    const product = products.find((candidate) => candidate.id === item.productId);
    return !product || product.availableStock < item.quantity;
  });
}

function getOrderTotalCents(items, products) {
  return items.reduce((total, item) => {
    const product = products.find((candidate) => candidate.id === item.productId);
    return total + ((product?.priceCents || 0) * Number(item.quantity || 0));
  }, 0);
}

module.exports = {
  findUnavailableItem,
  getOrderTotalCents,
  normalizeItems,
};
