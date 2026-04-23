const express = require('express');
const { readDb, updateDb } = require('../data/store');
const { patchProductAction } = require('../controllers/productController');
const { requireAdmin } = require('../middlewares/requireAdmin');
const { asyncHandler } = require('../utils/asyncHandler');

const router = express.Router();

router.use(requireAdmin);

router.get('/stats', asyncHandler(async (req, res) => {
  const db = await readDb();
  const revenue = db.orders.reduce((total, order) => total + Number(order.totalCents || 0), 0);

  res.json({
    success: true,
    stats: {
      products: db.products.length,
      orders: db.orders.length,
      revenue,
    },
  });
}));

router.get('/orders', asyncHandler(async (req, res) => {
  const db = await readDb();
  res.json({ success: true, orders: db.orders });
}));

router.patch('/orders/:orderId', asyncHandler(async (req, res) => {
  const status = String(req.body?.status || '').trim();

  if (!status) {
    res.status(400).json({ success: false, message: 'Statut requis' });
    return;
  }

  const nextDb = await updateDb((draft) => {
    const order = draft.orders.find((candidate) => candidate.id === req.params.orderId);

    if (order) {
      order.status = status;
    }
  });
  const order = nextDb.orders.find((candidate) => candidate.id === req.params.orderId);

  if (!order) {
    res.status(404).json({ success: false, message: 'Commande introuvable' });
    return;
  }

  res.json({ success: true, order });
}));

router.patch('/products/:productId/:action', asyncHandler(patchProductAction));

router.patch('/categories/:categoryId', asyncHandler(async (req, res) => {
  const displayOrder = Number(req.body?.displayOrder);

  if (!Number.isInteger(displayOrder)) {
    res.status(400).json({ success: false, message: 'Ordre de categorie invalide' });
    return;
  }

  const nextDb = await updateDb((draft) => {
    const category = draft.categories.find((candidate) => candidate.id === req.params.categoryId);

    if (category) {
      category.displayOrder = displayOrder;
    }
  });
  const category = nextDb.categories.find((candidate) => candidate.id === req.params.categoryId);

  if (!category) {
    res.status(404).json({ success: false, message: 'Categorie introuvable' });
    return;
  }

  res.json({ success: true, category });
}));

module.exports = router;
