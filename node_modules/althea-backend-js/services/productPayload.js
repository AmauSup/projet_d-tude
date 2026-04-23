const { ensureProductReferences } = require('./productUniqueness');
const {
  ensureNonEmptyString,
  ensurePositiveInteger,
  ensureStringArray,
  slugify,
} = require('./productFieldValidators');

function ensureProductPayload(db, payload, { existingProduct = null } = {}) {
  const name = ensureNonEmptyString(payload.name, 'name');
  const categoryId = ensureNonEmptyString(payload.categoryId, 'categoryId');
  const slug = slugify(payload.slug || name);
  const id = existingProduct?.id || payload.id || `prod-${slug}`;

  if (!slug) {
    throw new Error('Le slug du produit est invalide.');
  }

  ensureProductReferences(db, { categoryId, id, slug }, existingProduct);

  return {
    id,
    slug,
    categoryId,
    name,
    shortDescription: ensureNonEmptyString(payload.shortDescription, 'shortDescription'),
    description: ensureNonEmptyString(payload.description, 'description'),
    technicalFeatures: ensureStringArray(payload.technicalFeatures, 'technicalFeatures'),
    tags: ensureStringArray(payload.tags, 'tags'),
    priceCents: ensurePositiveInteger(payload.priceCents, 'priceCents'),
    availableStock: ensurePositiveInteger(payload.availableStock, 'availableStock'),
    priorityRank: ensurePositiveInteger(
      payload.priorityRank ?? existingProduct?.priorityRank ?? 0,
      'priorityRank',
    ),
    featuredRank: ensurePositiveInteger(
      payload.featuredRank ?? existingProduct?.featuredRank ?? 0,
      'featuredRank',
    ),
    createdAt: existingProduct?.createdAt || payload.createdAt || new Date().toISOString().slice(0, 10),
    images: ensureStringArray(payload.images, 'images', existingProduct?.images || []),
  };
}

module.exports = {
  ensureProductPayload,
  slugify,
};
