const { readDb, updateDb } = require('../data/store');

function isProductUsedInOrders(db, productId) {
  return db.orders.some((order) => (
    order.items.some((item) => item.productId === productId)
  ));
}

async function deleteProduct(req, res) {
  const db = await readDb();
  const { productId } = req.params;
  const product = db.products.find((candidate) => candidate.id === productId);

  if (!product) {
    res.status(404).json({ success: false, message: 'Produit introuvable.' });
    return;
  }

  if (isProductUsedInOrders(db, productId)) {
    res.status(409).json({
      success: false,
      message: 'Impossible de supprimer un produit deja reference dans des commandes.',
    });
    return;
  }

  await updateDb((draft) => {
    draft.products = draft.products.filter((candidate) => candidate.id !== productId);
  });

  res.json({ success: true, message: 'Produit supprime.' });
}

module.exports = { deleteProduct };
