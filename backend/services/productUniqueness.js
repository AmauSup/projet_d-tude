function ensureProductCategory(db, categoryId) {
  const category = db.categories.find((candidate) => candidate.id === categoryId);

  if (!category) {
    throw new Error('La categorie demandee est introuvable.');
  }
}

function ensureUniqueProductSlug(db, slug, existingProduct) {
  const conflictingProduct = db.products.find(
    (candidate) => candidate.slug === slug && candidate.id !== existingProduct?.id,
  );

  if (conflictingProduct) {
    throw new Error('Un produit existe deja avec ce slug.');
  }
}

function ensureUniqueProductId(db, productId, existingProduct) {
  const conflictingProduct = db.products.find(
    (candidate) => candidate.id === productId && candidate.id !== existingProduct?.id,
  );

  if (conflictingProduct) {
    throw new Error('Un produit existe deja avec cet identifiant.');
  }
}

function ensureProductReferences(db, product, existingProduct) {
  ensureProductCategory(db, product.categoryId);
  ensureUniqueProductSlug(db, product.slug, existingProduct);
  ensureUniqueProductId(db, product.id, existingProduct);
}

module.exports = { ensureProductReferences };
