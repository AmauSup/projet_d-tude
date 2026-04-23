const { getSearchFilters } = require('./productSearchFilters');
const { addRelevanceScore, matchesSearchFilters } = require('./productSearchScoring');
const { compareProductsBySearch } = require('./productSearchSort');

function searchProducts(products, query) {
  const filters = getSearchFilters(query);

  return products
    .map((product) => addRelevanceScore(product, filters))
    .filter((product) => matchesSearchFilters(product, filters))
    .sort((left, right) => compareProductsBySearch(left, right, filters));
}

module.exports = { searchProducts };
