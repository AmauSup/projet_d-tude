import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService.js';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [filterCategory, setFilterCategory] = useState('all');

  const load = () => {
    setLoading(true);
    adminService.listProducts()
      .then((prods) => {
        setProducts(prods);
        const cats = [];
        const seen = new Set();
        for (const p of prods) {
          if (p.category_id && !seen.has(p.category_id)) {
            seen.add(p.category_id);
            cats.push({ id: p.category_id, name: p.category_name || String(p.category_id) });
          }
        }
        setCategories(cats);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const filtered = products
    .filter((p) => filterCategory === 'all' || String(p.category_id) === String(filterCategory))
    .slice()
    .sort((a, b) => {
      const va = a[sortField] ?? '';
      const vb = b[sortField] ?? '';
      if (typeof va === 'string') {
        return sortDir === 'asc' ? va.localeCompare(vb, 'fr') : vb.localeCompare(va, 'fr');
      }
      return sortDir === 'asc' ? Number(va) - Number(vb) : Number(vb) - Number(va);
    });

  const handleToggleStock = async (product) => {
    const newStock = product.stock > 0 ? 0 : 10;
    try {
      await adminService.updateProduct(product.id, { stock: newStock });
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, stock: newStock } : p)));
    } catch (e) {
      setError(e.message);
    }
  };

  const handleToggleFeatured = async (product) => {
    const newFeatured = product.featured > 0 ? 0 : 1;
    try {
      await adminService.updateProduct(product.id, { featured: newFeatured });
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, featured: newFeatured } : p)));
    } catch (e) {
      setError(e.message);
    }
  };

  const handleTogglePriority = async (product) => {
    const newPriority = product.priority > 0 ? 0 : 5;
    try {
      await adminService.updateProduct(product.id, { priority: newPriority });
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, priority: newPriority } : p)));
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Supprimer "${product.name}" ?`)) return;
    try {
      await adminService.deleteProduct(product.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    } catch (e) {
      setError(e.message);
    }
  };

  function SortBtn({ field, label }) {
    return (
      <button type="button" className="btn btn--link" onClick={() => toggleSort(field)}>
        {label} {sortField === field ? (sortDir === 'asc' ? '▲' : '▼') : ''}
      </button>
    );
  }

  if (loading) return <article className="card"><div className="notice notice--info">Chargement…</div></article>;

  return (
    <article className="card stack">
      <h2>Gestion des produits</h2>
      {error && <div className="notice notice--warning" role="alert">{error}</div>}

      <div className="inline-actions">
        <label htmlFor="admin-filter-cat" className="form-label" style={{ marginBottom: 0 }}>
          Catégorie :
        </label>
        <select
          id="admin-filter-cat"
          className="select"
          style={{ width: 'auto' }}
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
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
              <th>Catégorie</th>
              <th><SortBtn field="price" label="Prix" /></th>
              <th><SortBtn field="stock" label="Stock" /></th>
              <th><SortBtn field="priority" label="Priorité" /></th>
              <th><SortBtn field="featured" label="Mis en avant" /></th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center' }}>
                  <span className="helper-text">Aucun produit.</span>
                </td>
              </tr>
            )}
            {filtered.map((product) => (
              <tr key={product.id} className={product.stock <= 0 ? 'row--unavailable' : ''}>
                <td>
                  <strong>{product.name}</strong>
                  <br />
                  <span className="helper-text">{product.slug}</span>
                </td>
                <td>{product.category_name || '—'}</td>
                <td>{Number(product.price).toFixed(2)} €</td>
                <td>
                  <span className={`status-pill ${product.stock > 0 ? 'status-pill--ok' : 'status-pill--danger'}`}>
                    {product.stock > 0 ? `${product.stock} en stock` : 'Rupture'}
                  </span>
                </td>
                <td>
                  {product.priority > 0
                    ? <span className="status-pill status-pill--warning">#{product.priority}</span>
                    : <span className="helper-text">–</span>}
                </td>
                <td>
                  {product.featured > 0
                    ? <span className="status-pill status-pill--ok">★ #{product.featured}</span>
                    : <span className="helper-text">–</span>}
                </td>
                <td>
                  <div className="inline-actions">
                    <button type="button" className="btn btn--secondary" onClick={() => handleToggleStock(product)}>
                      {product.stock > 0 ? 'Rupture' : '+ Stock'}
                    </button>
                    <button type="button" className="btn btn--secondary" onClick={() => handleTogglePriority(product)}>
                      {product.priority > 0 ? '↓ Dé-prioriser' : '↑ Prioriser'}
                    </button>
                    <button type="button" className="btn btn--secondary" onClick={() => handleToggleFeatured(product)}>
                      {product.featured > 0 ? '★ Retirer top' : '☆ Mettre en avant'}
                    </button>
                    <button
                      type="button"
                      className="btn btn--secondary"
                      style={{ color: 'var(--color-danger, #c0392b)' }}
                      onClick={() => handleDelete(product)}
                    >
                      Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}
