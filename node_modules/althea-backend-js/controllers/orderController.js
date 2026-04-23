const { updateDb } = require('../data/store');
const { applyOrderStockUpdate, buildOrder } = require('../services/orderBuilder');
const { findUnavailableItem, normalizeItems } = require('../services/orderItems');

function listOrders(req, res) {
  const orders = req.auth.user.role === 'admin'
    ? req.auth.db.orders
    : req.auth.db.orders.filter((order) => order.userId === req.auth.user.id);

  res.json({ success: true, orders });
}

async function createOrder(req, res) {
  const items = normalizeItems(req.body?.items);

  if (!items.length) {
    res.status(400).json({ success: false, message: 'Panier vide' });
    return;
  }

  if (findUnavailableItem(items, req.auth.db.products)) {
    res.status(409).json({ success: false, message: 'Un produit du panier est indisponible' });
    return;
  }

  const order = buildOrder({
    body: req.body,
    items,
    products: req.auth.db.products,
    userId: req.auth.user.id,
  });

  await updateDb((draft) => {
    draft.orders.unshift(order);
    draft.products = applyOrderStockUpdate(draft.products, items);
  });

  res.status(201).json({ success: true, order });
}

module.exports = {
  createOrder,
  listOrders,
};
