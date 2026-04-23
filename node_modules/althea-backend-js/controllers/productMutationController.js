const { readDb, updateDb } = require('../data/store');
const { ensureProductPayload } = require('../services/productPayload');

function toValidatedProduct(db, payload, options) {
  try {
    return ensureProductPayload(db, payload, options);
  } catch (error) {
    return { validationError: error };
  }
}

function sendValidationError(res, error) {
  res.status(400).json({ success: false, message: error.message });
}

async function createProduct(req, res) {
  const db = await readDb();
  const productPayload = toValidatedProduct(db, req.body || {});

  if (productPayload.validationError) {
    sendValidationError(res, productPayload.validationError);
    return;
  }

  const nextDb = await updateDb((draft) => {
    draft.products.push(productPayload);
  });
  const product = nextDb.products.find((candidate) => candidate.id === productPayload.id);

  res.status(201).json({ success: true, product });
}

async function updateProduct(req, res) {
  const db = await readDb();
  const existingProduct = db.products.find((candidate) => candidate.id === req.params.productId);

  if (!existingProduct) {
    res.status(404).json({ success: false, message: 'Produit introuvable.' });
    return;
  }

  const productPayload = toValidatedProduct(
    db,
    { ...existingProduct, ...req.body, id: req.params.productId },
    { existingProduct },
  );

  if (productPayload.validationError) {
    sendValidationError(res, productPayload.validationError);
    return;
  }

  const nextDb = await updateDb((draft) => {
    draft.products = draft.products.map((candidate) => (
      candidate.id === req.params.productId ? productPayload : candidate
    ));
  });
  const product = nextDb.products.find((candidate) => candidate.id === req.params.productId);

  res.json({ success: true, product });
}

module.exports = { createProduct, updateProduct };
