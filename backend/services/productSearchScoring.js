function getSearchRank(query, text) {
  const normalizedQuery = String(query || '').trim().toLowerCase();
  const normalizedText = String(text || '').toLowerCase();

  if (!normalizedQuery) return 0;
  if (normalizedText === normalizedQuery) return 1;
  if (normalizedText.startsWith(normalizedQuery)) return 2;
  if (normalizedText.includes(normalizedQuery)) return 3;

  return 99;
}

function getTechnicalText(product) {
  return `${product.technicalFeatures?.join(' ') || ''} ${product.tags?.join(' ') || ''}`;
}

function addRelevanceScore(product, filters) {
  const technicalText = getTechnicalText(product);
  const nameRank = getSearchRank(filters.textQuery, product.name);
  const descriptionRank = getSearchRank(filters.description || filters.textQuery, product.description);
  const technicalRank = filters.technical ? getSearchRank(filters.technical, technicalText) : 0;

  return {
    ...product,
    relevanceScore: Math.min(nameRank, descriptionRank, technicalRank || 99),
  };
}

function matchesSearchFilters(product, filters) {
  const technicalText = getTechnicalText(product);

  return (
    (filters.categoryId === 'all' || product.categoryId === filters.categoryId)
    && (!filters.availableOnly || product.availableStock > 0)
    && product.priceCents >= filters.minPriceCents
    && product.priceCents <= filters.maxPriceCents
    && (!filters.textQuery || product.relevanceScore < 99)
    && (!filters.description || getSearchRank(filters.description, product.description) < 99)
    && (!filters.technical || getSearchRank(filters.technical, technicalText) < 99)
  );
}

module.exports = {
  addRelevanceScore,
  matchesSearchFilters,
};
