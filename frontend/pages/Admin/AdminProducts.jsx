import React, { useState } from 'react';
import { formatPrice } from '../../utils/storefront.js';
import { adminService } from '../../services/adminService.js';

const EMPTY_FORM = { name: '', description: '', characteristics: '', price: '', stock: '', image: '', category_id: '', priority: 0, featured: 0, slug: '' };

export default function AdminProducts({
  products = [],
  categories = [],
  onToggleProductPriority,
  onToggleFeatured,
  onToggleProductAvailability,
  onProductsChange,
}) {
  const [sortField, setSortField] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [feedback, setFeedback] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const filtered = products
    .filter((p) => filterCategory === 'all' || String(p.categoryId) === String(filterCategory))
    .slice()
    .sort((a, b) => {
      const va = a[sortField];
      const vb = b[sortField];
      if (typeof va === 'string') {
        return sortDir === 'asc' ? va.localeCompare(vb, 'fr') : vb.localeCompare(va, 'fr');
      }
      return sortDir === 'asc' ? (va ?? 0) - (vb ?? 0) : (vb ?? 0) - (va ?? 0);
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function SortBtn({ field, label }) {
    return (
      <button type="button" className="btn btn--link" onClick={() => { toggleSort(field); setPage(1); }}>
        {label} {sortField === field ? (sortDir === 'asc' ? '▲' : '▼') : ''}
      </button>
    );
  }

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFeedback('');
    setShowForm(true);
  };

  const openEdit = (product) => {
    setEditingId(product.id);
    setForm({
      name: product.name || '',
      description: product.description || '',
      characteristics: product.characteristics || (product.technicalFeatures || []).join('\n'),
      price: product.price || (product.priceCents / 100) || '',
      stock: product.availableStock ?? '',
      image: product.image || product.images?.[0] || '',
      category_id: product.categoryId || '',
      priority: product.priorityRank || 0,
      featured: product.featuredRank || 0,
      slug: product.slug || '',
    });
    setFeedback('');
    setShowForm(true);
  };

  const handleDelete = async (productId, name) => {
    if (!window.confirm(`Supprimer "${name}" ? Cette action est irréversible.`)) return;
    try {
      await adminService.deleteProduct(productId);
      onProductsChange?.();
      setFeedback(`Produit "${name}" supprimé.`);
    } catch (e) {
      setFeedback(`Erreur : ${e.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || form.stock === '' || !form.category_id) {
      setFeedback('Nom, prix, stock et catégorie sont obligatoires.');
      return;
    }
    const payload = {
      name: form.name,
      description: form.description,
      characteristics: form.characteristics,
      price: Number(form.price),
      stock: Number(form.stock),
      image: form.image,
      category_id: Number(form.category_id),
      priority: Number(form.priority) || 0,
      featured: Number(form.featured) || 0,
      slug: form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    };
    try {
      if (editingId) {
        await adminService.updateProduct(editingId, payload);
        setFeedback('Produit mis à jour.');
      } else {
        await adminService.createProduct(payload);
        setFeedback('Produit créé.');
      }
      setShowForm(false);
      onProductsChange?.();
    } catch (err) {
      setFeedback(`Erreur : ${err.message}`);
    }
  };

  return (
    <article className="card stack">
      <div className="inline-actions" style={{ justifyContent: 'space-between' }}>
        <h2>Gestion des produits</h2>
        <button type="button" className="btn btn--primary" onClick={openCreate}>+ Nouveau produit</button>
      </div>

      {feedback && <div className="notice notice--info">{feedback}</div>}

      {showForm && (
        <div className="panel stack">
          <h3>{editingId ? 'Modifier le produit' : 'Nouveau produit'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <input className="input" placeholder="Nom *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <input className="input" placeholder="Slug (auto-généré si vide)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
              <input className="input" type="number" min="0" step="0.01" placeholder="Prix (€) *" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
              <input className="input" type="number" min="0" placeholder="Stock *" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} required />
              <input className="input" placeholder="URL image" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
              <select className="select" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} required>
                <option value="">Catégorie *</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <textarea className="input" style={{ width: '100%', minHeight: 70, marginTop: 8 }} placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <textarea className="input" style={{ width: '100%', minHeight: 70, marginTop: 8 }} placeholder="Caractéristiques techniques (une par ligne)" value={form.characteristics} onChange={(e) => setForm({ ...form, characteristics: e.target.value })} />
            <div className="inline-actions" style={{ marginTop: 12 }}>
              <button type="submit" className="btn btn--primary">{editingId ? 'Enregistrer' : 'Créer'}</button>
              <button type="button" className="btn btn--secondary" onClick={() => setShowForm(false)}>Annuler</button>
            </div>
          </form>
        </div>
      )}

      <div className="inline-actions">
        <label htmlFor="admin-filter-cat" className="form-label" style={{ marginBottom: 0 }}>Catégorie :</label>
        <select id="admin-filter-cat" className="select" style={{ width: 'auto' }} value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}>
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
            {paginated.map((product) => {
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
                      <button type="button" className="btn btn--secondary" onClick={() => openEdit(product)}>✏️ Modifier</button>
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
                      <button type="button" className="btn btn--secondary" style={{ color: 'var(--color-danger, #c0392b)' }} onClick={() => handleDelete(product.id, product.name)}>🗑 Supprimer</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <nav className="pagination" aria-label="Pagination produits">
          <button className="pagination__btn" type="button" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>‹</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} type="button" className={`pagination__btn ${p === page ? 'pagination__btn--active' : ''}`} onClick={() => setPage(p)}>{p}</button>
          ))}
          <button className="pagination__btn" type="button" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>›</button>
        </nav>
      )}
    </article>
  );
}
