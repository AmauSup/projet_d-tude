import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import './Search.css';
import { formatPrice } from '../../utils/storefront.js';
import Pagination from '../../components/Pagination/Pagination.jsx';
import ImageWithLoader from '../../components/common/ImageWithLoader.jsx';
import { useI18n } from '../../contexts/I18nContext.jsx';

const PAGE_SIZE = 12;

const criteriaShape = PropTypes.shape({
  query: PropTypes.string,
  description: PropTypes.string,
  technical: PropTypes.string,
  categoryId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  minPrice: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  maxPrice: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  availableOnly: PropTypes.bool,
  sortBy: PropTypes.string,
  sortDirection: PropTypes.string,
});

export default function Search({
  categories = [],
  criteria,
  onChangeCriteria,
  results = [],
  onOpenProduct,
}) {
  const { t } = useI18n();
  const [page, setPage] = useState(1);

  const updateCriteria = (name, value) => {
    setPage(1);
    onChangeCriteria((previous) => ({ ...previous, [name]: value }));
  };

  const totalPages = Math.ceil(results.length / PAGE_SIZE);
  const paginated = useMemo(
    () => results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [results, page],
  );

  return (
    <section className="page search-page">
      <header className="page__header">
        <h1 className="page__title">{t('search.title')}</h1>
        <p className="page__subtitle">{t('search.subtitle')}</p>
      </header>

      <div className="search-layout">
        <aside className="search-filters panel">
          <h3>{t('search.advancedFilters')}</h3>

          <div className="stack">
            <input
              className="input"
              placeholder={t('search.namePlaceholder')}
              value={criteria.query}
              onChange={(event) => updateCriteria('query', event.target.value)}
            />

            <input
              className="input"
              placeholder={t('search.descriptionPlaceholder')}
              value={criteria.description}
              onChange={(event) => updateCriteria('description', event.target.value)}
            />

            <input
              className="input"
              placeholder={t('search.technicalPlaceholder')}
              value={criteria.technical}
              onChange={(event) => updateCriteria('technical', event.target.value)}
            />

            <select
              className="select"
              value={criteria.categoryId}
              onChange={(event) => updateCriteria('categoryId', event.target.value)}
            >
              <option value="all">{t('search.allCategories')}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <div className="search-price-row">
              <input
                className="input"
                type="number"
                min="0"
                placeholder={t('search.priceMin')}
                value={criteria.minPrice}
                onChange={(event) => updateCriteria('minPrice', event.target.value)}
              />
              <input
                className="input"
                type="number"
                min="0"
                placeholder={t('search.priceMax')}
                value={criteria.maxPrice}
                onChange={(event) => updateCriteria('maxPrice', event.target.value)}
              />
            </div>

            <label>
              <input
                type="checkbox"
                checked={criteria.availableOnly}
                onChange={(event) => updateCriteria('availableOnly', event.target.checked)}
              />
              {' '}{t('search.availableOnly')}
            </label>

            <div className="search-price-row">
              <select
                className="select"
                value={criteria.sortBy}
                onChange={(event) => updateCriteria('sortBy', event.target.value)}
              >
                <option value="relevance">{t('search.sortRelevance')}</option>
                <option value="price">{t('search.sortPrice')}</option>
                <option value="createdAt">{t('search.sortNew')}</option>
                <option value="availability">{t('search.sortAvailability')}</option>
              </select>

              <select
                className="select"
                value={criteria.sortDirection}
                onChange={(event) => updateCriteria('sortDirection', event.target.value)}
              >
                <option value="asc">{t('search.sortAsc')}</option>
                <option value="desc">{t('search.sortDesc')}</option>
              </select>
            </div>
          </div>
        </aside>

        <div className="stack" style={{ flex: 1, minWidth: 0 }}>
          <div className="search-results card-grid">
            {paginated.map((product) => (
              <article className="card" key={product.id}>
                <ImageWithLoader className="card__image" src={product.image} alt={product.name} />
                <h3>{product.name}</h3>
                <p>{product.shortDescription}</p>

                <span className={`status-pill ${product.availableStock > 0 ? 'status-pill--ok' : 'status-pill--danger'}`}>
                  {product.availableStock > 0
                    ? `${product.availableStock} ${t('search.inStock')}`
                    : t('search.outOfStock')}
                </span>

                <strong>{formatPrice(product.priceCents)}</strong>

                <button
                  className="btn btn--secondary"
                  type="button"
                  onClick={() => onOpenProduct(product.slug)}
                >
                  {t('search.viewProduct')}
                </button>
              </article>
            ))}

            {paginated.length === 0 && (
              <div className="notice notice--warning">{t('search.noResults')}</div>
            )}
          </div>

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>

        <aside className="search-summary">
          <h3>{t('search.summaryTitle')}</h3>
          <p><strong>{results.length}</strong> {t('search.results')}</p>
          <p>{t('search.fuzzyInfo')}</p>
          <p>{t('search.sortActive')} {criteria.sortBy} / {criteria.sortDirection}</p>
        </aside>
      </div>
    </section>
  );
}

Search.propTypes = {
  categories: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.number, name: PropTypes.string })),
  criteria: criteriaShape.isRequired,
  onChangeCriteria: PropTypes.func.isRequired,
  results: PropTypes.array,
  onOpenProduct: PropTypes.func.isRequired,
};
