function compareByPrice(left, right, direction) {
  return direction === 'asc'
    ? left.priceCents - right.priceCents
    : right.priceCents - left.priceCents;
}

function compareByDate(left, right, direction) {
  return direction === 'asc'
    ? new Date(left.createdAt) - new Date(right.createdAt)
    : new Date(right.createdAt) - new Date(left.createdAt);
}

function compareByAvailability(left, right, direction) {
  return direction === 'asc'
    ? Number(right.availableStock > 0) - Number(left.availableStock > 0)
    : Number(left.availableStock > 0) - Number(right.availableStock > 0);
}

function compareProductsBySearch(left, right, filters) {
  if (filters.sortBy === 'price') {
    return compareByPrice(left, right, filters.sortDirection);
  }

  if (filters.sortBy === 'createdAt') {
    return compareByDate(left, right, filters.sortDirection);
  }

  if (filters.sortBy === 'availability') {
    return compareByAvailability(left, right, filters.sortDirection);
  }

  if (left.relevanceScore !== right.relevanceScore) {
    return left.relevanceScore - right.relevanceScore;
  }

  return left.name.localeCompare(right.name, 'fr');
}

module.exports = { compareProductsBySearch };
