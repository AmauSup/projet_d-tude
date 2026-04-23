const { readDb } = require('../data/store');
const { searchProducts } = require('../services/productSearch');

async function listProducts(req, res) {
  const db = await readDb();
  res.json({ success: true, products: db.products });
}

async function listProductsByCategory(req, res) {
  const db = await readDb();
  const products = db.products.filter((product) => product.categoryId === req.params.categoryId);

  res.json({ success: true, products });
}

async function getProductBySlug(req, res) {
  const db = await readDb();
  const product = db.products.find((candidate) => candidate.slug === req.params.slug);

  if (!product) {
    res.status(404).json({ success: false, message: 'Produit introuvable.' });
    return;
  }

  res.json({ success: true, product });
}

async function searchCatalog(req, res) {
  const db = await readDb();
  const results = searchProducts(db.products, req.query);

  res.json({
    success: true,
    results,
    total: results.length,
  });
}

module.exports = {
  getProductBySlug,
  listProducts,
  listProductsByCategory,
  searchCatalog,
  searchProducts,
};
