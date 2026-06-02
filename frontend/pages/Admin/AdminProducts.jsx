import React, { useState } from 'react';
import { formatPrice } from '../../utils/storefront.js';

export default function AdminProducts({
  products = [],
  categories = [],
  onToggleProductPriority,
  onToggleFeatured,
  onToggleProductAvailability,
}) {
  const [sortField, setSortField] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [filterCategory, setFilterCategory] = useState('all');

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const filtered = products
    .filter((p) => filterCategory === 'all' || p.categoryId === filterCategory)
    .slice()
    .sort((a, b) => {
      const va = a[sortField];
      const vb = b[sortField];
      if (typeof va === 'string') {
        return sortDir === 'asc' ? va.localeCompare(vb, 'fr') : vb.localeCompare(va, 'fr');
      }
      return sortDir === 'asc' ? va - vb : vb - va;
    });

  function SortBtn({ field, label }) {
    return (
      <button type="button" className="btn btn--link" onClick={() => toggleSort(field)}>
        {label} {sortField === field ? (sortDir === 'asc' ? '▲' : '▼') : ''}
      </button>
    );
  }

  return (
    <article className="card stack">
      <h2>Gestion des produits</h2>

      <div className="inline-actions">
        <label htmlFor="admin-filter-cat" className="form-label" style={{ marginBottom: 0 }}>Catégorie :</label>
        <select id="admin-filter-cat" className="select" style={{ width: 'auto' }} value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="all">Toutes</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <span className="helper-text">{filtered.length} produit(s)</span>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th><SortBtn field="name" label="Nom" /></th>
              <th><SortBtn field="categoryId" label="Catégorie" /></th>
              <th><SortBtn field="priceCents" label="Prix" /></th>
              <th><SortBtn field="availableStock" label="Stock" /></th>
              <th><SortBtn field="priorityRank" label="Priorité" /></th>
              <th><SortBtn field="featuredRank" label="Mis en avant" /></th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((product) => {
              const category = categories.find((c) => c.id === product.categoryId);
              return (
                <tr key={product.id} className={product.availableStock <= 0 ? 'row--unavailable' : ''}>
                  <td>
                    <strong>{product.name}</strong>
                    <br />
                    <span className="helper-text">{product.slug}</span>
                  </td>
                  <td>{category?.name || product.categoryId}</td>
                  <td>{formatPrice(product.priceCents)}</td>
                  <td>
                    <span className={`status-pill ${product.availableStock > 0 ? 'status-pill--ok' : 'status-pill--danger'}`}>
                      {product.availableStock > 0 ? `${product.availableStock} en stock` : 'Rupture'}
                    </span>
                  </td>
                  <td>
                    {product.priorityRank > 0
                      ? <span className="status-pill status-pill--warning">#{product.priorityRank}</span>
                      : <span className="helper-text">–</span>}
                  </td>
                  <td>
                    {product.featuredRank > 0
                      ? <span className="status-pill status-pill--ok">★ #{product.featuredRank}</span>
                      : <span className="helper-text">–</span>}
                  </td>
                  <td>
                    <div className="inline-actions">
                      <button
                        type="button"
                        className="btn btn--secondary"
                        title={product.availableStock > 0 ? 'Mettre en rupture' : 'Remettre en stock'}
                        onClick={() => onToggleProductAvailability(product.id)}
                      >
                        {product.availableStock > 0 ? '⛔ Rupture' : '✅ Stock'}
                      </button>
                      <button
                        type="button"
                        className="btn btn--secondary"
                        title={product.priorityRank > 0 ? 'Retirer priorité' : 'Rendre prioritaire'}
                        onClick={() => onToggleProductPriority(product.id)}
                      >
                        {product.priorityRank > 0 ? '↓ Dé-prioriser' : '↑ Prioriser'}
                      </button>
                      <button
                        type="button"
                        className="btn btn--secondary"
                        title={product.featuredRank > 0 ? 'Retirer du top' : 'Mettre en avant'}
                        onClick={() => onToggleFeatured(product.id)}
                      >
                        {product.featuredRank > 0 ? '★ Retirer' : '☆ Mettre en avant'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="notice notice--info">
        Backend hook : la création / modification complète (images, prix, descriptions) nécessite une API REST connectée.
      </div>
    </article>
  );
}
