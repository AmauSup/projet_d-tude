function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function ensureNonEmptyString(value, fieldName) {
  const normalized = String(value || '').trim();
  if (!normalized) {
    throw new Error(`Le champ ${fieldName} est requis.`);
  }

  return normalized;
}

function ensurePositiveInteger(value, fieldName, { allowZero = true } = {}) {
  const normalized = Number(value);
  const isValidInteger = Number.isInteger(normalized);
  const isValidRange = allowZero ? normalized >= 0 : normalized > 0;
  if (!isValidInteger || !isValidRange) {
    throw new Error(`Le champ ${fieldName} est invalide.`);
  }

  return normalized;
}

function ensureBoolean(value) {
  if (typeof value === 'boolean') {
    return value;
  }

  return String(value).toLowerCase() === 'true';
}

function ensureProductPayload(db, payload, { existingProduct = null } = {}) {
  const name = ensureNonEmptyString(payload.name, 'name');
  const categoryId = ensureNonEmptyString(payload.categoryId, 'categoryId');
  const category = db.categories.find((candidate) => candidate.id === categoryId);
  if (!category) {
    throw new Error('La categorie demandee est introuvable.');
  }

  const slug = slugify(payload.slug || name);
  if (!slug) {
    throw new Error('Le slug du produit est invalide.');
  }

  const conflictingProduct = db.products.find(
    (candidate) => candidate.slug === slug && candidate.id !== existingProduct?.id,
  );
  if (conflictingProduct) {
    throw new Error('Un produit existe deja avec ce slug.');
  }

  const nextId = existingProduct?.id || payload.id || `prod-${slug}`;
  const conflictingProductId = db.products.find(
    (candidate) => candidate.id === nextId && candidate.id !== existingProduct?.id,
  );
  if (conflictingProductId) {
    throw new Error('Un produit existe deja avec cet identifiant.');
  }

  return {
    id: nextId,
    slug,
    categoryId,
    name,
    shortDescription: ensureNonEmptyString(payload.shortDescription, 'shortDescription'),
    description: ensureNonEmptyString(payload.description, 'description'),
    technicalFeatures: Array.isArray(payload.technicalFeatures)
      ? payload.technicalFeatures.map((item) => ensureNonEmptyString(item, 'technicalFeatures'))
      : [],
    tags: Array.isArray(payload.tags)
      ? payload.tags.map((item) => ensureNonEmptyString(item, 'tags'))
      : [],
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
    images: Array.isArray(payload.images)
      ? payload.images.map((item) => ensureNonEmptyString(item, 'images'))
      : existingProduct?.images || [],
  };
}

function getSearchRank(query, text) {
  const normalizedQuery = String(query || '').trim().toLowerCase();
  const normalizedText = String(text || '').toLowerCase();

  if (!normalizedQuery) {
    return 0;
  }

  if (normalizedText === normalizedQuery) {
    return 1;
  }

  if (normalizedText.startsWith(normalizedQuery)) {
    return 2;
  }

  if (normalizedText.includes(normalizedQuery)) {
    return 3;
  }

  return 99;
}

function searchProducts(products, params) {
  const query = String(params.get('q') || '');
  const description = String(params.get('description') || '');
  const technical = String(params.get('technical') || '');
  const categoryId = String(params.get('categoryId') || 'all');
  const availableOnly = ensureBoolean(params.get('availableOnly') || false);
  const minPrice = params.get('minPrice') ? Number(params.get('minPrice')) * 100 : 0;
  const maxPrice = params.get('maxPrice') ? Number(params.get('maxPrice')) * 100 : Number.MAX_SAFE_INTEGER;
  const sortBy = String(params.get('sortBy') || 'relevance');
  const sortDirection = String(params.get('sortDirection') || 'asc');

  const enrichedResults = products
    .map((product) => {
      const technicalText = `${product.technicalFeatures?.join(' ') || ''} ${product.tags?.join(' ') || ''}`;
      const nameRank = getSearchRank(query, product.name);
      const descriptionRank = getSearchRank(description || query, product.description);
      const technicalRank = technical ? getSearchRank(technical, technicalText) : 0;

      return {
        ...product,
        relevanceScore: Math.min(nameRank, descriptionRank, technicalRank || 99),
      };
    })
    .filter((product) => {
      const technicalText = `${product.technicalFeatures?.join(' ') || ''} ${product.tags?.join(' ') || ''}`;
      const matchesCategory = categoryId === 'all' || product.categoryId === categoryId;
      const matchesAvailability = !availableOnly || product.availableStock > 0;
      const matchesMinPrice = product.priceCents >= minPrice;
      const matchesMaxPrice = product.priceCents <= maxPrice;
      const matchesText = !query || product.relevanceScore < 99;
      const matchesDescription = !description || getSearchRank(description, product.description) < 99;
      const matchesTechnical = !technical || getSearchRank(technical, technicalText) < 99;

      return matchesCategory
        && matchesAvailability
        && matchesMinPrice
        && matchesMaxPrice
        && matchesText
        && matchesDescription
        && matchesTechnical;
    });

  return [...enrichedResults].sort((left, right) => {
    if (sortBy === 'price') {
      return sortDirection === 'asc'
        ? left.priceCents - right.priceCents
        : right.priceCents - left.priceCents;
    }

    if (sortBy === 'createdAt') {
      return sortDirection === 'asc'
        ? new Date(left.createdAt) - new Date(right.createdAt)
        : new Date(right.createdAt) - new Date(left.createdAt);
    }

    if (sortBy === 'availability') {
      return sortDirection === 'asc'
        ? Number(right.availableStock > 0) - Number(left.availableStock > 0)
        : Number(left.availableStock > 0) - Number(right.availableStock > 0);
    }

    if (left.relevanceScore !== right.relevanceScore) {
      return left.relevanceScore - right.relevanceScore;
    }

    return left.name.localeCompare(right.name, 'fr');
  });
}

async function listProducts({ res, readDb, sendJson }) {
  const db = await readDb();
  sendJson(res, 200, { success: true, products: db.products });
}

async function listProductsByCategory({ res, categoryId, readDb, sendJson }) {
  const db = await readDb();
  const products = db.products.filter((product) => product.categoryId === categoryId);
  sendJson(res, 200, { success: true, products });
}

async function getProductBySlug({ res, slug, readDb, sendJson, sendError }) {
  const db = await readDb();
  const product = db.products.find((candidate) => candidate.slug === slug);
  if (!product) {
    sendError(res, 404, 'Produit introuvable.');
    return;
  }

  sendJson(res, 200, { success: true, product });
}

async function searchCatalog({ res, searchParams, readDb, sendJson }) {
  const db = await readDb();
  const results = searchProducts(db.products, searchParams);
  sendJson(res, 200, {
    success: true,
    results,
    total: results.length,
  });
}

async function createProduct({
  req,
  res,
  readDb,
  updateDb,
  sendJson,
  sendError,
  readJsonBody,
  requireAdmin,
}) {
  const db = await readDb();
  const auth = requireAdmin(req, res, db);
  if (!auth) {
    return;
  }

  const body = await readJsonBody(req);

  let productPayload;
  try {
    productPayload = ensureProductPayload(db, body);
  } catch (error) {
    sendError(res, 400, error.message);
    return;
  }

  const nextDb = await updateDb((draft) => {
    draft.products.push(productPayload);
  });
  const product = nextDb.products.find((candidate) => candidate.id === productPayload.id);

  sendJson(res, 201, {
    success: true,
    product,
  });
}

async function updateProduct({
  req,
  res,
  productId,
  readDb,
  updateDb,
  sendJson,
  sendError,
  readJsonBody,
  requireAdmin,
}) {
  const db = await readDb();
  const auth = requireAdmin(req, res, db);
  if (!auth) {
    return;
  }

  const existingProduct = db.products.find((candidate) => candidate.id === productId);
  if (!existingProduct) {
    sendError(res, 404, 'Produit introuvable.');
    return;
  }

  const body = await readJsonBody(req);

  let productPayload;
  try {
    productPayload = ensureProductPayload(
      db,
      { ...existingProduct, ...body, id: productId },
      { existingProduct },
    );
  } catch (error) {
    sendError(res, 400, error.message);
    return;
  }

  const nextDb = await updateDb((draft) => {
    draft.products = draft.products.map((candidate) => (
      candidate.id === productId ? productPayload : candidate
    ));
  });
  const product = nextDb.products.find((candidate) => candidate.id === productId);

  sendJson(res, 200, {
    success: true,
    product,
  });
}

async function deleteProduct({
  req,
  res,
  productId,
  readDb,
  updateDb,
  sendJson,
  sendError,
  requireAdmin,
}) {
  const db = await readDb();
  const auth = requireAdmin(req, res, db);
  if (!auth) {
    return;
  }

  const product = db.products.find((candidate) => candidate.id === productId);
  if (!product) {
    sendError(res, 404, 'Produit introuvable.');
    return;
  }

  const isUsedInOrders = db.orders.some((order) => order.items.some((item) => item.productId === productId));
  if (isUsedInOrders) {
    sendError(res, 409, 'Impossible de supprimer un produit deja reference dans des commandes.');
    return;
  }

  await updateDb((draft) => {
    draft.products = draft.products.filter((candidate) => candidate.id !== productId);
  });

  sendJson(res, 200, {
    success: true,
    message: 'Produit supprime.',
  });
}

async function patchProductAction({
  req,
  res,
  productId,
  action,
  readDb,
  updateDb,
  sendJson,
  sendError,
  requireAdmin,
}) {
  const db = await readDb();
  const auth = requireAdmin(req, res, db);
  if (!auth) {
    return;
  }

  const nextDb = await updateDb((draft) => {
    const product = draft.products.find((candidate) => candidate.id === productId);
    if (!product) {
      return;
    }

    if (action === 'priority') {
      const maxPriority = Math.max(0, ...draft.products.map((item) => item.priorityRank || 0));
      product.priorityRank = product.priorityRank > 0 ? 0 : maxPriority + 1;
    }

    if (action === 'availability') {
      product.availableStock = product.availableStock > 0 ? 0 : 10;
    }

    if (action === 'featured') {
      const maxFeatured = Math.max(0, ...draft.products.map((item) => item.featuredRank || 0));
      product.featuredRank = product.featuredRank > 0 ? 0 : maxFeatured + 1;
    }
  });
  const product = nextDb.products.find((candidate) => candidate.id === productId);

  if (!product) {
    sendError(res, 404, 'Produit introuvable.');
    return;
  }

  sendJson(res, 200, { success: true, product });
}

module.exports = {
  createProduct,
  deleteProduct,
  getProductBySlug,
  listProducts,
  listProductsByCategory,
  patchProductAction,
  searchCatalog,
  updateProduct,
};
