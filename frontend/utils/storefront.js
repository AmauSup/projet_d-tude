export function formatPrice(cents) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

function levenshteinDistance(source, target) {
  const sourceValue = source.toLowerCase();
  const targetValue = target.toLowerCase();
  const rows = sourceValue.length + 1;
  const columns = targetValue.length + 1;
  const matrix = Array.from({ length: rows }, () => Array(columns).fill(0));

  for (let row = 0; row < rows; row += 1) {
    matrix[row][0] = row;
  }

  for (let column = 0; column < columns; column += 1) {
    matrix[0][column] = column;
  }

  for (let row = 1; row < rows; row += 1) {
    for (let column = 1; column < columns; column += 1) {
      const cost = sourceValue[row - 1] === targetValue[column - 1] ? 0 : 1;
      matrix[row][column] = Math.min(
        matrix[row - 1][column] + 1,
        matrix[row][column - 1] + 1,
        matrix[row - 1][column - 1] + cost,
      );
    }
  }

  return matrix[rows - 1][columns - 1];
}

export function sortProductsForCategory(products) {
  return [...products].sort((left, right) => {
    const leftAvailable = left.availableStock > 0;
    const rightAvailable = right.availableStock > 0;

    if (leftAvailable !== rightAvailable) {
      return Number(rightAvailable) - Number(leftAvailable);
    }

    const leftPriority = left.priorityRank > 0;
    const rightPriority = right.priorityRank > 0;

    if (leftPriority !== rightPriority) {
      return Number(rightPriority) - Number(leftPriority);
    }

    if (left.priorityRank !== right.priorityRank) {
      const leftRank = left.priorityRank || Number.MAX_SAFE_INTEGER;
      const rightRank = right.priorityRank || Number.MAX_SAFE_INTEGER;
      return leftRank - rightRank;
    }

    return left.name.localeCompare(right.name, 'fr');
  });
}

export function buildRelatedProducts(products, product, limit = 6) {
  return sortProductsForCategory(
    products.filter((candidate) => candidate.categoryId === product.categoryId && candidate.id !== product.id),
  ).slice(0, limit);
}

function getSearchRank(query, text) {
  if (!query) {
    return 0;
  }

  const normalizedQuery = query.trim().toLowerCase();
  const normalizedText = text.toLowerCase();

  if (normalizedText === normalizedQuery) {
    return 1;
  }

  if (levenshteinDistance(normalizedText, normalizedQuery) === 1 || normalizedText.split(' ').some((part) => levenshteinDistance(part, normalizedQuery) === 1)) {
    return 2;
  }

  if (normalizedText.startsWith(normalizedQuery)) {
    return 3;
  }

  if (normalizedText.includes(normalizedQuery)) {
    return 4;
  }

  return 99;
}

export function searchProducts(products, criteria) {
  const {
    query = '',
    description = '',
    technical = '',
    categoryId = 'all',
    availableOnly = false,
    minPrice = '',
    maxPrice = '',
    sortBy = 'relevance',
    sortDirection = 'asc',
  } = criteria;

  const minPriceCents = minPrice ? Number(minPrice) * 100 : 0;
  const maxPriceCents = maxPrice ? Number(maxPrice) * 100 : Number.MAX_SAFE_INTEGER;

  const enrichedResults = products
    .map((product) => {
      const nameRank = getSearchRank(query, product.name);
      const descriptionRank = getSearchRank(description || query, product.description);
      const technicalRank = technical
        ? getSearchRank(technical, `${product.technicalFeatures.join(' ')} ${product.tags.join(' ')}`)
        : 0;

      return {
        ...product,
        relevanceScore: Math.min(nameRank, descriptionRank, technicalRank || 99),
      };
    })
    .filter((product) => {
      const matchesCategory = categoryId === 'all' || product.categoryId === categoryId;
      const matchesAvailability = !availableOnly || product.availableStock > 0;
      const matchesMinPrice = product.priceCents >= minPriceCents;
      const matchesMaxPrice = product.priceCents <= maxPriceCents;
      const matchesText = !query || product.relevanceScore < 99;
      const matchesDescription = !description || getSearchRank(description, product.description) < 99;
      const matchesTechnical =
        !technical || getSearchRank(technical, `${product.technicalFeatures.join(' ')} ${product.tags.join(' ')}`) < 99;

      return (
        matchesCategory &&
        matchesAvailability &&
        matchesMinPrice &&
        matchesMaxPrice &&
        matchesText &&
        matchesDescription &&
        matchesTechnical
      );
    });

  const sortedResults = [...enrichedResults].sort((left, right) => {
    if (sortBy === 'price') {
      return sortDirection === 'asc' ? left.priceCents - right.priceCents : right.priceCents - left.priceCents;
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

  return sortedResults;
}

export function buildCartDetails(cartItems, products) {
  return cartItems
    .map((item) => {
      const product = products.find((candidate) => candidate.id === item.productId);
      if (!product) {
        return null;
      }

      const availableQuantity = Math.min(item.quantity, Math.max(product.availableStock, 0));
      const lineTotalCents = product.availableStock > 0 ? product.priceCents * availableQuantity : 0;

      return {
        ...item,
        product,
        availableQuantity,
        isUnavailable: product.availableStock <= 0,
        lineTotalCents,
      };
    })
    .filter(Boolean);
}

export function computeCartSummary(cartDetails) {
  const subtotalCents = cartDetails.reduce((sum, item) => sum + item.lineTotalCents, 0);
  const promotionCents = subtotalCents >= 300000 ? Math.round(subtotalCents * 0.05) : 0;
  const taxableBase = subtotalCents - promotionCents;
  const taxCents = Math.round(taxableBase * 0.2);
  const totalCents = taxableBase + taxCents;
  const unavailableCount = cartDetails.filter((item) => item.isUnavailable).length;

  return {
    subtotalCents,
    promotionCents,
    taxCents,
    totalCents,
    unavailableCount,
  };
}

export function createOrderId() {
  const timestamp = Date.now().toString().slice(-6);
  return `CMD-2026-${timestamp}`;
}
