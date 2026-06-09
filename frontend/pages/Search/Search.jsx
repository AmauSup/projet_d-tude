import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import './Search.css';
import { formatPrice } from '../../utils/storefront.js';
import Pagination from '../../components/Pagination/Pagination.jsx';

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
        <h1 className="page__title">Recherche</h1>
        <p className="page__subtitle">
          Recherche multi-critères avec correspondance floue (jusqu'à 2 fautes de frappe).
        </p>
      </header>

      <div className="search-layout">
        <aside className="search-filters panel">
          <h3>Filtres avancés</h3>

          <div className="stack">
            <input
              className="input"
              placeholder="Nom / titre"
              value={criteria.query}
              onChange={(event) => updateCriteria('query', event.target.value)}
            />

            <input
              className="input"
              placeholder="Description"
              value={criteria.description}
              onChange={(event) => updateCriteria('description', event.target.value)}
            />

            <input
              className="input"
              placeholder="Caractéristique technique"
              value={criteria.technical}
              onChange={(event) => updateCriteria('technical', event.target.value)}
            />

            <select
              className="select"
              value={criteria.categoryId}
              onChange={(event) => updateCriteria('categoryId', event.target.value)}
            >
              <option value="all">Toutes les catégories</option>
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
                placeholder="Prix min"
                value={criteria.minPrice}
                onChange={(event) => updateCriteria('minPrice', event.target.value)}
              />
              <input
                className="input"
                type="number"
                min="0"
                placeholder="Prix max"
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
              {' '}Uniquement les produits disponibles
            </label>

            <div className="search-price-row">
              <select
                className="select"
                value={criteria.sortBy}
                onChange={(event) => updateCriteria('sortBy', event.target.value)}
              >
                <option value="relevance">Pertinence</option>
                <option value="price">Prix</option>
                <option value="createdAt">Nouveauté</option>
                <option value="availability">Disponibilité</option>
              </select>

              <select
                className="select"
                value={criteria.sortDirection}
                onChange={(event) => updateCriteria('sortDirection', event.target.value)}
              >
                <option value="asc">Croissant / priorité dispo</option>
                <option value="desc">Décroissant / priorité rupture</option>
              </select>
            </div>
          </div>
        </aside>

        <div className="stack" style={{ flex: 1, minWidth: 0 }}>
          <div className="search-results card-grid">
            {paginated.map((product) => (
              <article className="card" key={product.id}>
                {product.image ? (
                  <img className="card__image" src={product.image} alt={product.name} />
                ) : (
                  <div className="card__image" />
                )}
                <h3>{product.name}</h3>
                <p>{product.shortDescription}</p>

                <span className={`status-pill ${product.availableStock > 0 ? 'status-pill--ok' : 'status-pill--danger'}`}>
                  {product.availableStock > 0 ? `${product.availableStock} en stock` : 'En rupture de stock'}
                </span>

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
              <div className="notice notice--warning">Aucun résultat pour ces critères.</div>
            )}
          </div>

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>

        <aside className="search-summary">
          <h3>Résumé</h3>
          <p><strong>{results.length}</strong> résultat(s)</p>
          <p>Recherche floue : exact → inclusion → préfixe → distance 1 → distance 2.</p>
          <p>Tri actif : {criteria.sortBy} / {criteria.sortDirection}</p>
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
