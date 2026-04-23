const { updateDb } = require('../data/store');
const { applyProductAction, isValidProductAction } = require('../services/productActions');

async function patchProductAction(req, res) {
  const { action, productId } = req.params;

  if (!isValidProductAction(action)) {
    res.status(400).json({ success: false, message: 'Action produit invalide.' });
    return;
  }

  const nextDb = await updateDb((draft) => {
    const product = draft.products.find((candidate) => candidate.id === productId);

    if (product) {
      applyProductAction(product, draft.products, action);
    }
  });
  const product = nextDb.products.find((candidate) => candidate.id === productId);

  if (!product) {
    res.status(404).json({ success: false, message: 'Produit introuvable.' });
    return;
  }

  res.json({ success: true, product });
}

module.exports = { patchProductAction };
