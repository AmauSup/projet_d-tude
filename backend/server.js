const http = require('http');
const crypto = require('crypto');
const { readDb, updateDb, ensureDbFile } = require('./data/store');

const PORT = Number(process.env.PORT || 3001);

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json; charset=utf-8',
  });
  res.end(JSON.stringify(payload));
}

function sendEmpty(res, statusCode = 204) {
  res.writeHead(statusCode, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end();
}

function sendError(res, statusCode, message) {
  sendJson(res, statusCode, {
    success: false,
    message,
  });
}

function sanitizeUser(user) {
  const { password, ...safeUser } = user;
  return safeUser;
}

function getBearerToken(req) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return '';
  }

  return authHeader.slice('Bearer '.length).trim();
}

async function readJsonBody(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new Error('Le corps de la requete JSON est invalide.');
  }
}

function findSession(db, token) {
  return db.sessions.find((session) => session.token === token) || null;
}

function findUserBySession(db, token) {
  if (!token) {
    return null;
  }

  const session = findSession(db, token);
  if (!session) {
    return null;
  }

  const user = db.users.find((candidate) => candidate.id === session.userId);
  if (!user) {
    return null;
  }

  return { session, user };
}

function requireAuth(req, res, db) {
  const token = getBearerToken(req);
  const auth = findUserBySession(db, token);

  if (!auth) {
    sendError(res, 401, 'Authentification requise.');
    return null;
  }

  return auth;
}

function requireAdmin(req, res, db) {
  const auth = requireAuth(req, res, db);
  if (!auth) {
    return null;
  }

  if (auth.user.role !== 'admin') {
    sendError(res, 403, 'Acces administrateur requis.');
    return null;
  }

  return auth;
}

function sortCategories(categories) {
  return [...categories].sort((left, right) => left.displayOrder - right.displayOrder);
}

function sortOrders(orders) {
  return [...orders].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
}

function sortSupportMessages(messages) {
  return [...messages].sort((left, right) => new Date(right.updatedAt || right.createdAt) - new Date(left.updatedAt || left.createdAt));
}

function createToken() {
  return crypto.randomBytes(24).toString('hex');
}

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
    priorityRank: ensurePositiveInteger(payload.priorityRank ?? existingProduct?.priorityRank ?? 0, 'priorityRank'),
    featuredRank: ensurePositiveInteger(payload.featuredRank ?? existingProduct?.featuredRank ?? 0, 'featuredRank'),
    createdAt: existingProduct?.createdAt || payload.createdAt || new Date().toISOString().slice(0, 10),
    images: Array.isArray(payload.images)
      ? payload.images.map((item) => ensureNonEmptyString(item, 'images'))
      : existingProduct?.images || [],
  };
}

function ensureCategoryPayload(db, payload, { existingCategory = null } = {}) {
  const name = ensureNonEmptyString(payload.name, 'name');
  const slug = slugify(payload.slug || name);
  if (!slug) {
    throw new Error('Le slug de la categorie est invalide.');
  }

  const conflictingCategory = db.categories.find(
    (candidate) => candidate.slug === slug && candidate.id !== existingCategory?.id,
  );
  if (conflictingCategory) {
    throw new Error('Une categorie existe deja avec ce slug.');
  }

  const nextId = existingCategory?.id || payload.id || slug;
  const conflictingCategoryId = db.categories.find(
    (candidate) => candidate.id === nextId && candidate.id !== existingCategory?.id,
  );
  if (conflictingCategoryId) {
    throw new Error('Une categorie existe deja avec cet identifiant.');
  }

  return {
    id: nextId,
    slug,
    name,
    heroLabel: ensureNonEmptyString(payload.heroLabel || name, 'heroLabel'),
    description: ensureNonEmptyString(payload.description, 'description'),
    imageHint: ensureNonEmptyString(payload.imageHint || payload.description, 'imageHint'),
    displayOrder: ensurePositiveInteger(
      payload.displayOrder ?? existingCategory?.displayOrder ?? db.categories.length + 1,
      'displayOrder',
      { allowZero: false },
    ),
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

function createOrderId(db) {
  const year = new Date().getFullYear();
  const suffix = String(Date.now()).slice(-6);
  return `CMD-${year}-${suffix}-${db.orders.length + 1}`;
}

function computeCartTotals(dbProducts, orderItems) {
  const normalizedItems = orderItems.map((item) => {
    const product = dbProducts.find((candidate) => candidate.id === item.productId);
    if (!product) {
      throw new Error(`Produit introuvable: ${item.productId}`);
    }

    if (product.availableStock <= 0) {
      throw new Error(`Le produit ${product.name} est indisponible.`);
    }

    if (item.quantity > product.availableStock) {
      throw new Error(`Stock insuffisant pour ${product.name}.`);
    }

    return {
      productId: item.productId,
      quantity: Number(item.quantity),
      product,
    };
  });

  const subtotalCents = normalizedItems.reduce(
    (sum, item) => sum + item.product.priceCents * item.quantity,
    0,
  );
  const promotionCents = subtotalCents >= 300000 ? Math.round(subtotalCents * 0.05) : 0;
  const taxableBase = subtotalCents - promotionCents;
  const taxCents = Math.round(taxableBase * 0.2);
  const totalCents = taxableBase + taxCents;

  return {
    items: normalizedItems.map(({ productId, quantity }) => ({ productId, quantity })),
    subtotalCents,
    promotionCents,
    taxCents,
    totalCents,
  };
}

async function handleRequest(req, res) {
  if (req.method === 'OPTIONS') {
    sendEmpty(res);
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const { pathname } = url;

  try {
    if (req.method === 'GET' && pathname === '/api/health') {
      sendJson(res, 200, { success: true, status: 'ok' });
      return;
    }

    if (req.method === 'GET' && pathname === '/api/storefront') {
      const db = await readDb();
      sendJson(res, 200, {
        success: true,
        homeContent: db.homeContent,
        categories: sortCategories(db.categories),
        products: db.products,
      });
      return;
    }

    if (req.method === 'GET' && pathname === '/api/products') {
      const db = await readDb();
      sendJson(res, 200, { success: true, products: db.products });
      return;
    }

    if (req.method === 'GET' && pathname.startsWith('/api/products/category/')) {
      const categoryId = decodeURIComponent(pathname.split('/').pop());
      const db = await readDb();
      const products = db.products.filter((product) => product.categoryId === categoryId);
      sendJson(res, 200, { success: true, products });
      return;
    }

    if (req.method === 'GET' && pathname.startsWith('/api/products/')) {
      const slug = decodeURIComponent(pathname.split('/').pop());
      const db = await readDb();
      const product = db.products.find((candidate) => candidate.slug === slug);
      if (!product) {
        sendError(res, 404, 'Produit introuvable.');
        return;
      }

      sendJson(res, 200, { success: true, product });
      return;
    }

    if (req.method === 'GET' && pathname === '/api/categories') {
      const db = await readDb();
      sendJson(res, 200, { success: true, categories: sortCategories(db.categories) });
      return;
    }

    if (req.method === 'GET' && pathname === '/api/search') {
      const db = await readDb();
      const results = searchProducts(db.products, url.searchParams);
      sendJson(res, 200, {
        success: true,
        results,
        total: results.length,
      });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/auth/login') {
      const body = await readJsonBody(req);
      const db = await readDb();
      const user = db.users.find(
        (candidate) =>
          candidate.email.toLowerCase() === String(body.email || '').toLowerCase().trim(),
      );

      if (!user || user.password !== body.password) {
        sendError(res, 401, 'Email ou mot de passe invalide.');
        return;
      }

      const token = createToken();
      await updateDb((draft) => {
        draft.sessions = draft.sessions.filter((session) => session.userId !== user.id);
        draft.sessions.push({
          token,
          userId: user.id,
          createdAt: new Date().toISOString(),
        });
      });

      sendJson(res, 200, {
        success: true,
        token,
        userRole: user.role,
        user: sanitizeUser(user),
      });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/auth/register') {
      const body = await readJsonBody(req);
      const email = String(body.email || '').toLowerCase().trim();
      const password = String(body.password || '');

      if (!body.firstName || !body.lastName || !email) {
        sendError(res, 400, 'Les champs obligatoires sont incomplets.');
        return;
      }

      if (password.length < 8) {
        sendError(res, 400, 'Le mot de passe doit contenir au moins 8 caracteres.');
        return;
      }

      const db = await readDb();
      const existingUser = db.users.find((candidate) => candidate.email.toLowerCase() === email);
      if (existingUser) {
        sendError(res, 409, 'Un compte existe deja avec cet email.');
        return;
      }

      const user = {
        id: crypto.randomUUID(),
        firstName: body.firstName,
        lastName: body.lastName,
        email,
        password,
        phone: body.phone || '',
        company: body.company || '',
        verified: false,
        role: 'customer',
        addresses: [],
        paymentMethods: [],
      };
      const token = createToken();

      await updateDb((draft) => {
        draft.users.push(user);
        draft.sessions.push({
          token,
          userId: user.id,
          createdAt: new Date().toISOString(),
        });
      });

      sendJson(res, 201, {
        success: true,
        token,
        userRole: user.role,
        requiresEmailVerification: true,
        user: sanitizeUser(user),
      });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/auth/forgot-password') {
      const body = await readJsonBody(req);
      sendJson(res, 200, {
        success: true,
        email: body.email || '',
        message: 'Si un compte existe, un email de reinitialisation sera envoye.',
      });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/auth/logout') {
      const token = getBearerToken(req);
      if (token) {
        await updateDb((draft) => {
          draft.sessions = draft.sessions.filter((session) => session.token !== token);
        });
      }

      sendJson(res, 200, {
        success: true,
        message: 'Deconnexion effectuee.',
      });
      return;
    }

    if (req.method === 'GET' && pathname === '/api/account/profile') {
      const db = await readDb();
      const auth = requireAuth(req, res, db);
      if (!auth) {
        return;
      }

      sendJson(res, 200, { success: true, user: sanitizeUser(auth.user) });
      return;
    }

    if (req.method === 'PUT' && pathname === '/api/account/profile') {
      const body = await readJsonBody(req);
      const db = await readDb();
      const auth = requireAuth(req, res, db);
      if (!auth) {
        return;
      }

      const nextDb = await updateDb((draft) => {
        const user = draft.users.find((candidate) => candidate.id === auth.user.id);
        user.firstName = body.firstName ?? user.firstName;
        user.lastName = body.lastName ?? user.lastName;
        user.phone = body.phone ?? user.phone;
        user.company = body.company ?? user.company;
      });
      const user = nextDb.users.find((candidate) => candidate.id === auth.user.id);

      sendJson(res, 200, {
        success: true,
        message: 'Profil mis a jour.',
        user: sanitizeUser(user),
      });
      return;
    }

    if (req.method === 'PATCH' && pathname === '/api/account/password') {
      const body = await readJsonBody(req);
      const db = await readDb();
      const auth = requireAuth(req, res, db);
      if (!auth) {
        return;
      }

      const oldPassword = String(body.oldPassword || '');
      const newPassword = String(body.newPassword || '');
      const confirmPassword = String(body.confirmPassword || '');

      if (auth.user.password !== oldPassword) {
        sendError(res, 400, 'Le mot de passe actuel est incorrect.');
        return;
      }

      if (newPassword.length < 8) {
        sendError(res, 400, 'Le nouveau mot de passe doit contenir au moins 8 caracteres.');
        return;
      }

      if (confirmPassword && confirmPassword !== newPassword) {
        sendError(res, 400, 'La confirmation du mot de passe ne correspond pas.');
        return;
      }

      await updateDb((draft) => {
        const user = draft.users.find((candidate) => candidate.id === auth.user.id);
        user.password = newPassword;
      });

      sendJson(res, 200, {
        success: true,
        message: 'Mot de passe mis a jour.',
      });
      return;
    }

    if (req.method === 'GET' && pathname === '/api/account/addresses') {
      const db = await readDb();
      const auth = requireAuth(req, res, db);
      if (!auth) {
        return;
      }

      sendJson(res, 200, {
        success: true,
        addresses: auth.user.addresses || [],
      });
      return;
    }

    if (req.method === 'PUT' && pathname === '/api/account/addresses') {
      const body = await readJsonBody(req);
      const db = await readDb();
      const auth = requireAuth(req, res, db);
      if (!auth) {
        return;
      }

      const addresses = Array.isArray(body.addresses) ? body.addresses : [];
      const normalizedAddresses = addresses.map((address) => ({
        ...address,
        id: address.id || crypto.randomUUID(),
      }));

      const nextDb = await updateDb((draft) => {
        const user = draft.users.find((candidate) => candidate.id === auth.user.id);
        user.addresses = normalizedAddresses;
      });
      const user = nextDb.users.find((candidate) => candidate.id === auth.user.id);

      sendJson(res, 200, {
        success: true,
        message: 'Adresses mises a jour.',
        user: sanitizeUser(user),
      });
      return;
    }

    if (req.method === 'GET' && pathname === '/api/orders') {
      const db = await readDb();
      const auth = requireAuth(req, res, db);
      if (!auth) {
        return;
      }

      const orders = sortOrders(db.orders.filter((order) => order.userId === auth.user.id));
      sendJson(res, 200, {
        success: true,
        orders,
      });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/orders') {
      const body = await readJsonBody(req);
      const db = await readDb();
      const auth = findUserBySession(db, getBearerToken(req));

      const rawItems = Array.isArray(body.items) ? body.items : [];
      if (rawItems.length === 0) {
        sendError(res, 400, 'Le panier est vide.');
        return;
      }

      if (!body.billingAddress || !body.paymentDetails) {
        sendError(res, 400, 'Informations de facturation ou de paiement manquantes.');
        return;
      }

      const totals = computeCartTotals(db.products, rawItems);
      const order = {
        id: createOrderId(db),
        userId: auth?.user.id || null,
        createdAt: new Date().toISOString().slice(0, 10),
        status: 'En attente',
        totalCents: totals.totalCents,
        items: totals.items,
        billingAddress: body.billingAddress,
        paymentSummary: `${body.paymentDetails.cardholderName} •••• ${String(
          body.paymentDetails.cardNumber || '',
        ).slice(-4)}`,
      };

      await updateDb((draft) => {
        draft.orders.unshift(order);
        draft.products = draft.products.map((product) => {
          const orderedItem = totals.items.find((item) => item.productId === product.id);
          if (!orderedItem) {
            return product;
          }

          return {
            ...product,
            availableStock: Math.max(0, product.availableStock - orderedItem.quantity),
          };
        });

        if (auth?.user) {
          const user = draft.users.find((candidate) => candidate.id === auth.user.id);
          if (user) {
            user.addresses = user.addresses?.length
              ? user.addresses
              : [{ ...body.billingAddress, id: body.billingAddress.id || crypto.randomUUID() }];
            user.paymentMethods = user.paymentMethods?.length
              ? user.paymentMethods
              : [
                  {
                    id: `pm-${Date.now()}`,
                    label: 'Carte enregistree',
                    cardholderName: body.paymentDetails.cardholderName,
                    last4: String(body.paymentDetails.cardNumber || '').slice(-4),
                    expiry: body.paymentDetails.expiry,
                  },
                ];
          }
        }
      });

      sendJson(res, 201, {
        success: true,
        order,
      });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/checkout/validate') {
      const body = await readJsonBody(req);
      if (body.hasUnavailableItems) {
        sendJson(res, 200, {
          success: true,
          valid: false,
          message: 'Retirez les produits indisponibles.',
        });
        return;
      }

      if (!body.hasItems) {
        sendJson(res, 200, {
          success: true,
          valid: false,
          message: 'Panier vide.',
        });
        return;
      }

      sendJson(res, 200, {
        success: true,
        valid: true,
      });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/checkout/payment-intent') {
      sendJson(res, 200, {
        success: true,
        clientSecret: `pi_${crypto.randomBytes(12).toString('hex')}`,
      });
      return;
    }

    if (req.method === 'GET' && pathname === '/api/admin/stats') {
      const db = await readDb();
      const auth = requireAdmin(req, res, db);
      if (!auth) {
        return;
      }

      sendJson(res, 200, {
        success: true,
        stats: {
          products: db.products.length,
          orders: db.orders.length,
          revenue: db.orders.reduce((sum, order) => sum + order.totalCents, 0),
        },
      });
      return;
    }

    if (req.method === 'GET' && pathname === '/api/admin/orders') {
      const db = await readDb();
      const auth = requireAdmin(req, res, db);
      if (!auth) {
        return;
      }

      sendJson(res, 200, {
        success: true,
        orders: sortOrders(db.orders),
      });
      return;
    }

    if (req.method === 'GET' && pathname === '/api/admin/support') {
      const db = await readDb();
      const auth = requireAdmin(req, res, db);
      if (!auth) {
        return;
      }

      sendJson(res, 200, {
        success: true,
        supportMessages: sortSupportMessages(db.supportMessages || []),
        chatMessages: [...(db.chatMessages || [])].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt)),
      });
      return;
    }

    if (req.method === 'PATCH' && pathname.startsWith('/api/admin/orders/')) {
      const db = await readDb();
      const auth = requireAdmin(req, res, db);
      if (!auth) {
        return;
      }

      const orderId = decodeURIComponent(pathname.split('/').pop());
      const body = await readJsonBody(req);
      const nextDb = await updateDb((draft) => {
        const order = draft.orders.find((candidate) => candidate.id === orderId);
        if (order) {
          order.status = body.status || order.status;
        }
      });
      const order = nextDb.orders.find((candidate) => candidate.id === orderId);

      if (!order) {
        sendError(res, 404, 'Commande introuvable.');
        return;
      }

      sendJson(res, 200, { success: true, order });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/admin/products') {
      const body = await readJsonBody(req);
      const db = await readDb();
      const auth = requireAdmin(req, res, db);
      if (!auth) {
        return;
      }

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
      return;
    }

    if (req.method === 'PUT' && /^\/api\/admin\/products\/[^/]+$/.test(pathname)) {
      const body = await readJsonBody(req);
      const db = await readDb();
      const auth = requireAdmin(req, res, db);
      if (!auth) {
        return;
      }

      const productId = decodeURIComponent(pathname.split('/').pop());
      const existingProduct = db.products.find((candidate) => candidate.id === productId);
      if (!existingProduct) {
        sendError(res, 404, 'Produit introuvable.');
        return;
      }

      let productPayload;
      try {
        productPayload = ensureProductPayload(db, { ...existingProduct, ...body, id: productId }, { existingProduct });
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
      return;
    }

    if (req.method === 'DELETE' && /^\/api\/admin\/products\/[^/]+$/.test(pathname)) {
      const db = await readDb();
      const auth = requireAdmin(req, res, db);
      if (!auth) {
        return;
      }

      const productId = decodeURIComponent(pathname.split('/').pop());
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
      return;
    }

    if (req.method === 'PATCH' && pathname.startsWith('/api/admin/products/')) {
      const db = await readDb();
      const auth = requireAdmin(req, res, db);
      if (!auth) {
        return;
      }

      const parts = pathname.split('/');
      const productId = decodeURIComponent(parts[4] || '');
      const action = parts[5] || '';

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
      return;
    }

    if (req.method === 'POST' && pathname === '/api/admin/categories') {
      const body = await readJsonBody(req);
      const db = await readDb();
      const auth = requireAdmin(req, res, db);
      if (!auth) {
        return;
      }

      let categoryPayload;
      try {
        categoryPayload = ensureCategoryPayload(db, body);
      } catch (error) {
        sendError(res, 400, error.message);
        return;
      }

      const nextDb = await updateDb((draft) => {
        draft.categories.push(categoryPayload);
      });
      const category = nextDb.categories.find((candidate) => candidate.id === categoryPayload.id);

      sendJson(res, 201, {
        success: true,
        category,
      });
      return;
    }

    if (req.method === 'PUT' && /^\/api\/admin\/categories\/[^/]+$/.test(pathname)) {
      const body = await readJsonBody(req);
      const db = await readDb();
      const auth = requireAdmin(req, res, db);
      if (!auth) {
        return;
      }

      const categoryId = decodeURIComponent(pathname.split('/').pop());
      const existingCategory = db.categories.find((candidate) => candidate.id === categoryId);
      if (!existingCategory) {
        sendError(res, 404, 'Categorie introuvable.');
        return;
      }

      let categoryPayload;
      try {
        categoryPayload = ensureCategoryPayload(
          db,
          { ...existingCategory, ...body, id: categoryId },
          { existingCategory },
        );
      } catch (error) {
        sendError(res, 400, error.message);
        return;
      }

      const nextDb = await updateDb((draft) => {
        draft.categories = draft.categories.map((candidate) => (
          candidate.id === categoryId ? categoryPayload : candidate
        ));
      });
      const category = nextDb.categories.find((candidate) => candidate.id === categoryId);

      sendJson(res, 200, {
        success: true,
        category,
      });
      return;
    }

    if (req.method === 'DELETE' && /^\/api\/admin\/categories\/[^/]+$/.test(pathname)) {
      const db = await readDb();
      const auth = requireAdmin(req, res, db);
      if (!auth) {
        return;
      }

      const categoryId = decodeURIComponent(pathname.split('/').pop());
      const category = db.categories.find((candidate) => candidate.id === categoryId);
      if (!category) {
        sendError(res, 404, 'Categorie introuvable.');
        return;
      }

      const hasProducts = db.products.some((product) => product.categoryId === categoryId);
      if (hasProducts) {
        sendError(res, 409, 'Impossible de supprimer une categorie qui contient encore des produits.');
        return;
      }

      await updateDb((draft) => {
        draft.categories = draft.categories.filter((candidate) => candidate.id !== categoryId);
      });

      sendJson(res, 200, {
        success: true,
        message: 'Categorie supprimee.',
      });
      return;
    }

    if (req.method === 'PATCH' && pathname.startsWith('/api/admin/categories/')) {
      const db = await readDb();
      const auth = requireAdmin(req, res, db);
      if (!auth) {
        return;
      }

      const categoryId = decodeURIComponent(pathname.split('/').pop());
      const body = await readJsonBody(req);
      const nextDb = await updateDb((draft) => {
        const category = draft.categories.find((candidate) => candidate.id === categoryId);
        if (category) {
          category.displayOrder = Number(body.displayOrder) || category.displayOrder;
        }
      });
      const category = nextDb.categories.find((candidate) => candidate.id === categoryId);

      if (!category) {
        sendError(res, 404, 'Categorie introuvable.');
        return;
      }

      sendJson(res, 200, { success: true, category });
      return;
    }

    if (req.method === 'PATCH' && /^\/api\/admin\/support\/[^/]+$/.test(pathname)) {
      const body = await readJsonBody(req);
      const db = await readDb();
      const auth = requireAdmin(req, res, db);
      if (!auth) {
        return;
      }

      const supportId = decodeURIComponent(pathname.split('/').pop());
      const nextDb = await updateDb((draft) => {
        const supportMessage = draft.supportMessages.find((candidate) => candidate.id === supportId);
        if (!supportMessage) {
          return;
        }

        supportMessage.status = body.status || supportMessage.status || 'new';
        supportMessage.assignee = body.assignee ?? supportMessage.assignee ?? '';
        supportMessage.adminNotes = body.adminNotes ?? supportMessage.adminNotes ?? '';
        supportMessage.updatedAt = new Date().toISOString();
      });
      const supportMessage = nextDb.supportMessages.find((candidate) => candidate.id === supportId);

      if (!supportMessage) {
        sendError(res, 404, 'Ticket support introuvable.');
        return;
      }

      sendJson(res, 200, {
        success: true,
        supportMessage,
      });
      return;
    }

    if (req.method === 'PATCH' && pathname === '/api/content/home/message') {
      const db = await readDb();
      const auth = requireAdmin(req, res, db);
      if (!auth) {
        return;
      }

      const body = await readJsonBody(req);
      const nextDb = await updateDb((draft) => {
        draft.homeContent.fixedMessage = body.fixedMessage || draft.homeContent.fixedMessage;
      });

      sendJson(res, 200, {
        success: true,
        homeContent: nextDb.homeContent,
      });
      return;
    }

    if (req.method === 'PATCH' && pathname === '/api/content/home/carousel/reorder') {
      const db = await readDb();
      const auth = requireAdmin(req, res, db);
      if (!auth) {
        return;
      }

      const body = await readJsonBody(req);
      const nextDb = await updateDb((draft) => {
        const slides = [...draft.homeContent.carousel];
        const currentIndex = slides.findIndex((slide) => slide.id === body.slideId);
        const nextIndex = body.direction === 'up' ? currentIndex - 1 : currentIndex + 1;

        if (
          currentIndex < 0 ||
          nextIndex < 0 ||
          nextIndex >= slides.length
        ) {
          return;
        }

        [slides[currentIndex], slides[nextIndex]] = [slides[nextIndex], slides[currentIndex]];
        draft.homeContent.carousel = slides;
      });

      sendJson(res, 200, {
        success: true,
        homeContent: nextDb.homeContent,
      });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/support/contact') {
      const body = await readJsonBody(req);
      if (!body.name || !body.email || !body.message) {
        sendError(res, 400, 'Nom, email et message sont requis.');
        return;
      }

      const messageRecord = {
        id: `msg-${Date.now()}`,
        name: body.name,
        email: body.email,
        subject: body.subject || 'support',
        message: body.message,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'new',
        assignee: '',
        adminNotes: '',
      };

      await updateDb((draft) => {
        draft.supportMessages.unshift(messageRecord);
      });

      sendJson(res, 201, {
        success: true,
        id: messageRecord.id,
        payload: messageRecord,
      });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/support/chat') {
      const body = await readJsonBody(req);
      const message = String(body.message || '').trim();
      if (!message) {
        sendError(res, 400, 'Le message est vide.');
        return;
      }

      const reply = `Assistant Althea: nous avons bien recu "${message}" et un conseiller peut prendre le relais si besoin.`;

      await updateDb((draft) => {
        draft.chatMessages.unshift({
          id: `chat-${Date.now()}`,
          message,
          reply,
          createdAt: new Date().toISOString(),
        });
      });

      sendJson(res, 200, {
        success: true,
        reply,
      });
      return;
    }

    sendError(res, 404, 'Route introuvable.');
  } catch (error) {
    sendError(res, 500, error.message || 'Erreur interne du serveur.');
  }
}

async function startServer() {
  await ensureDbFile();

  const server = http.createServer((req, res) => {
    handleRequest(req, res);
  });

  server.listen(PORT, () => {
    console.log(`Althea backend JS running on http://localhost:${PORT}/api`);
  });
}

startServer();
