function ensureBoolean(value) {
  if (typeof value === 'boolean') {
    return value;
  }

  return String(value).toLowerCase() === 'true';
}

function getParam(query, name, fallback = '') {
  const value = query[name];
  return Array.isArray(value) ? value[0] : value ?? fallback;
}

function getSearchFilters(query) {
  const minPrice = getParam(query, 'minPrice');
  const maxPrice = getParam(query, 'maxPrice');

  return {
    textQuery: String(getParam(query, 'q')),
    description: String(getParam(query, 'description')),
    technical: String(getParam(query, 'technical')),
    categoryId: String(getParam(query, 'categoryId', 'all')),
    availableOnly: ensureBoolean(getParam(query, 'availableOnly', false)),
    minPriceCents: minPrice ? Number(minPrice) * 100 : 0,
    maxPriceCents: maxPrice ? Number(maxPrice) * 100 : Number.MAX_SAFE_INTEGER,
    sortBy: String(getParam(query, 'sortBy', 'relevance')),
    sortDirection: String(getParam(query, 'sortDirection', 'asc')),
  };
}

module.exports = { getSearchFilters };
