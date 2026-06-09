import React, { useMemo, useState } from 'react';
import './Category.css';
import { formatPrice } from '../../utils/storefront.js';
import Pagination from '../../components/Pagination/Pagination.jsx';

const PAGE_SIZE = 12;

export default function Category({
  categories = [],
  activeCategory,
  products = [],
  onSelectCategory,
  onOpenProduct,
}) {
  const [availableOnly, setAvailableOnly] = useState(false);
  const [priorityOnly, setPriorityOnly] = useState(false);
  const [page, setPage] = useState(1);

  const filteredProducts = useMemo(() => {
    setPage(1);
    return products.filter((product) => {
      if (availableOnly && product.availableStock <= 0) return false;
      if (priorityOnly && product.priorityRank <= 0) return false;
      return true;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableOnly, priorityOnly, products]);

  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE);
  const paginated = filteredProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <section className="page category-page">
      <header className="page__header">
        <h1 className="page__title">Catalogue — {activeCategory?.name}</h1>
        <p className="page__subtitle">
          Tri métier : produits prioritaires puis disponibles, les ruptures de stock restant visibles en bas.
        </p>
      </header>

      <div className="category-hero">
        {activeCategory?.imageUrl ? (
          <img className="category-hero__image" src={activeCategory.imageUrl} alt={activeCategory.name} />
        ) : (
          <div className="card__image category-hero__image" />
        )}
        <div className="category-hero__content">
          <span className="badge">{activeCategory?.heroLabel || activeCategory?.name}</span>
          <h2>{activeCategory?.name}</h2>
          <p>{activeCategory?.description}</p>
        </div>
      </div>

      <div className="category-layout">
        <aside className="category-filters">
          <h3>Navigation & filtres</h3>

          <select
            className="select"
            value={activeCategory?.slug}
            onChange={(event) => onSelectCategory(event.target.value)}
          >
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
            />
            Disponible uniquement
          </label>

          <label>
            <input
              type="checkbox"
              checked={priorityOnly}
              onChange={(event) => setPriorityOnly(event.target.checked)}
            />
            Prioritaire back-office
          </label>

          <p className="helper-text">{filteredProducts.length} produit(s)</p>
        </aside>

        <div className="stack" style={{ flex: 1 }}>
          <div className="card-grid">
            {paginated.map((product) => (
              <article
                className={`card category-card ${product.availableStock <= 0 ? 'is-unavailable' : ''}`}
                key={product.id}
              >
                {product.image ? (
                  <img className="card__image" src={product.image} alt={product.name} />
                ) : (
                  <div className="card__image" />
                )}
                <h3>{product.name}</h3>
                <p>{product.shortDescription}</p>

                <div className="inline-actions">
                  <span className={`status-pill ${product.availableStock > 0 ? 'status-pill--ok' : 'status-pill--danger'}`}>
                    {product.availableStock > 0 ? `${product.availableStock} en stock` : 'En rupture de stock'}
                  </span>
                  {product.priorityRank > 0 ? (
                    <span className="status-pill status-pill--warning">Prioritaire #{product.priorityRank}</span>
                  ) : null}
                </div>

                <strong>{formatPrice(product.priceCents)}</strong>

                <button
                  className="btn btn--secondary"
                  type="button"
                  onClick={() => onOpenProduct(product.slug)}
                >
                  Voir le produit
                </button>
              </article>
            ))}
            {paginated.length === 0 && (
              <div className="notice notice--info">Aucun produit ne correspond aux filtres sélectionnés.</div>
            )}
          </div>

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>
    </section>
  );
}
