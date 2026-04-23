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
  const isValidRange = allowZero ? normalized >= 0 : normalized > 0;

  if (!Number.isInteger(normalized) || !isValidRange) {
    throw new Error(`Le champ ${fieldName} est invalide.`);
  }

  return normalized;
}

function ensureStringArray(value, fieldName, fallback = []) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  return value.map((item) => ensureNonEmptyString(item, fieldName));
}

module.exports = {
  ensureNonEmptyString,
  ensurePositiveInteger,
  ensureStringArray,
  slugify,
};
