import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import './Category.css';
import { formatPrice } from '../../utils/storefront.js';
import Pagination from '../../components/Pagination/Pagination.jsx';
import ImageWithLoader from '../../components/common/ImageWithLoader.jsx';
import { useI18n } from '../../contexts/I18nContext.jsx';

const PAGE_SIZE = 12;

export default function Category({
  categories = [],
  activeCategory,
  products = [],
  onSelectCategory,
  onOpenProduct,
  onAddToCart,
}) {
  const { t } = useI18n();
  const [availableOnly, setAvailableOnly] = useState(false);
  const [priorityOnly, setPriorityOnly] = useState(false);
  const [sortBy, setSortBy] = useState('default');
  const [page, setPage] = useState(1);

  const filteredProducts = useMemo(() => {
    setPage(1);
    const filtered = products.filter((product) => {
      if (availableOnly && product.availableStock <= 0) return false;
      if (priorityOnly && product.priorityRank <= 0) return false;
      return true;
    });
    if (sortBy === 'price-asc') return [...filtered].sort((a, b) => a.priceCents - b.priceCents);
    if (sortBy === 'price-desc') return [...filtered].sort((a, b) => b.priceCents - a.priceCents);
    if (sortBy === 'name-asc') return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === 'name-desc') return [...filtered].sort((a, b) => b.name.localeCompare(a.name));
    return filtered;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableOnly, priorityOnly, sortBy, products]);

  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE);
  const paginated = filteredProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <section className="page category-page">
      <header className="page__header">
        <h1 className="page__title">
          {activeCategory
            ? `${t('category.title')} — ${activeCategory.name}`
            : t('category.titleAll')}
        </h1>
        <p className="page__subtitle">{t('category.subtitle')}</p>
      </header>

      <div className="category-hero">
        <div className="category-hero__image-wrap">
          <ImageWithLoader
            className={`category-hero__image${activeCategory?.imageUrl ? '' : ' category-hero__image--placeholder'}`}
            src={activeCategory?.imageUrl}
            alt={activeCategory?.name || ''}
          />
          <div className="category-hero__overlay">
            <span className="badge">{activeCategory?.heroLabel || activeCategory?.name}</span>
            <h2>{activeCategory?.name}</h2>
          </div>
        </div>
        <div className="category-hero__content">
          <p>{activeCategory?.description}</p>
        </div>
      </div>

      <div className="category-layout">
        <aside className="category-filters">
          <h3>{t('category.navAndFilters')}</h3>

          <select
            className="select"
            value={activeCategory?.slug ?? ''}
            onChange={(event) => onSelectCategory(event.target.value)}
          >
            <option value="">{t('category.allProducts')}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>

          <label>
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(event) => setAvailableOnly(event.target.checked)}
            />{' '}
            {t('category.availableOnly')}
          </label>

          <label>
            <input
              type="checkbox"
              checked={priorityOnly}
              onChange={(event) => setPriorityOnly(event.target.checked)}
            />{' '}
            {t('category.priorityOnly')}
          </label>

          <select
            className="select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label={t('category.sortBy')}
          >
            <option value="default">{t('category.sortDefault')}</option>
            <option value="price-asc">{t('category.sortPriceAsc')}</option>
            <option value="price-desc">{t('category.sortPriceDesc')}</option>
            <option value="name-asc">{t('category.sortNameAsc')}</option>
            <option value="name-desc">{t('category.sortNameDesc')}</option>
          </select>

          <p className="helper-text">{filteredProducts.length} {t('category.productCount')}</p>
        </aside>

        <div className="stack" style={{ flex: 1 }}>
          <div className="card-grid">
            {paginated.map((product) => (
              <article
                className={`card category-card ${product.availableStock <= 0 ? 'is-unavailable' : ''}`}
                key={product.id}
              >
                <ImageWithLoader className="card__image" src={product.image} alt={product.name} />
                <h3>{product.name}</h3>
                <p>{product.shortDescription}</p>

                <div className="inline-actions">
                  <span className={`status-pill ${product.availableStock > 0 ? 'status-pill--ok' : 'status-pill--danger'}`}>
                    {product.availableStock > 0
                      ? `${product.availableStock} ${t('category.inStock')}`
                      : t('category.outOfStock')}
                  </span>
                  {product.priorityRank > 0 ? (
                    <span className="status-pill status-pill--warning">{t('category.priorityLabel')}{product.priorityRank}</span>
                  ) : null}
                </div>

                <strong>{formatPrice(product.priceCents)}</strong>

                <div className="inline-actions" style={{ marginTop: 8 }}>
                  {onAddToCart && product.availableStock > 0 && (
                    <button
                      className="btn btn--primary"
                      type="button"
                      onClick={() => onAddToCart(product.id, 1)}
                    >
                      {t('category.addToCart')}
                    </button>
                  )}
                  <button
                    className="btn btn--secondary"
                    type="button"
                    onClick={() => onOpenProduct(product.slug)}
                  >
                    {t('category.viewProduct')}
                  </button>
                </div>
              </article>
            ))}
            {paginated.length === 0 && (
              <div className="notice notice--info">{t('category.noResults')}</div>
            )}
          </div>

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>
    </section>
  );
}

Category.propTypes = {
  categories: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number,
    slug: PropTypes.string,
    name: PropTypes.string,
  })),
  activeCategory: PropTypes.shape({
    id: PropTypes.number,
    slug: PropTypes.string,
    name: PropTypes.string,
    imageUrl: PropTypes.string,
    description: PropTypes.string,
    heroLabel: PropTypes.string,
  }),
  products: PropTypes.array,
  onSelectCategory: PropTypes.func.isRequired,
  onOpenProduct: PropTypes.func.isRequired,
  onAddToCart: PropTypes.func,
};
