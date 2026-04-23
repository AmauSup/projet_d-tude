const { getOrderTotalCents } = require('./orderItems');

function getPaymentSummary(paymentDetails = {}) {
  const last4 = paymentDetails.cardNumber
    ? String(paymentDetails.cardNumber).replace(/\s/g, '').slice(-4)
    : paymentDetails.last4;

  return last4 ? `Carte **** ${last4}` : 'Paiement enregistre';
}

function buildOrder({ body, items, products, userId }) {
  return {
    id: `CMD-${Date.now()}`,
    userId,
    createdAt: new Date().toISOString(),
    status: 'En preparation expedition',
    totalCents: getOrderTotalCents(items, products),
    items,
    billingAddress: body?.billingAddress || null,
    paymentSummary: getPaymentSummary(body?.paymentDetails),
  };
}

function applyOrderStockUpdate(products, items) {
  return products.map((product) => {
    const orderedItem = items.find((item) => item.productId === product.id);

    if (!orderedItem) {
      return product;
    }

    return {
      ...product,
      availableStock: Math.max(0, product.availableStock - orderedItem.quantity),
    };
  });
}

module.exports = {
  applyOrderStockUpdate,
  buildOrder,
};
