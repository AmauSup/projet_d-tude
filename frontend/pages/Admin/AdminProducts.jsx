import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { adminService } from '../../services/adminService.js';

const EMPTY_FORM = { name: '', description: '', characteristics: '', price: '', stock: '', image: '', category_id: '' };

CreateProductForm.propTypes = {
  categories: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.number, name: PropTypes.string })).isRequired,
  onCreated: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

function CreateProductForm({ categories, onCreated, onCancel }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || form.stock === '' || !form.category_id) {
      setError('Nom, prix, stock et catégorie sont obligatoires.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await adminService.createProduct({
        name: form.name,
        description: form.description,
        characteristics: form.characteristics,
        price: Number.parseFloat(form.price),
        stock: Number.parseInt(form.stock, 10),
        image: form.image || null,
        category_id: Number.parseInt(form.category_id, 10),
      });
      onCreated();
    } catch (err) {
      setError(err.message || 'Erreur lors de la création.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="panel stack" onSubmit={handleSubmit} noValidate>
      <h3>Nouveau produit</h3>
      {error && <div className="notice notice--warning" role="alert">{error}</div>}
      <div className="form-grid">
        <div style={{ gridColumn: '1 / -1' }}>
          <label className="form-label" htmlFor="new-name">Nom <span aria-hidden="true">*</span></label>
          <input id="new-name" className="input" value={form.name} onChange={(e) => set('name', e.target.value)} required />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label className="form-label" htmlFor="new-desc">Description</label>
          <textarea id="new-desc" className="textarea" rows="3" value={form.description} onChange={(e) => set('description', e.target.value)} />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label className="form-label" htmlFor="new-chars">Caractéristiques techniques</label>
          <textarea id="new-chars" className="textarea" rows="2" value={form.characteristics} onChange={(e) => set('characteristics', e.target.value)} />
        </div>
        <div>
          <label className="form-label" htmlFor="new-price">Prix (€) <span aria-hidden="true">*</span></label>
          <input id="new-price" className="input" type="number" min="0" step="0.01" value={form.price} onChange={(e) => set('price', e.target.value)} required />
        </div>
        <div>
          <label className="form-label" htmlFor="new-stock">Stock <span aria-hidden="true">*</span></label>
          <input id="new-stock" className="input" type="number" min="0" value={form.stock} onChange={(e) => set('stock', e.target.value)} required />
        </div>
        <div>
          <label className="form-label" htmlFor="new-cat">Catégorie <span aria-hidden="true">*</span></label>
          <select id="new-cat" className="select" value={form.category_id} onChange={(e) => set('category_id', e.target.value)} required>
            <option value="">-- Choisir --</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label" htmlFor="new-img">URL de l'image</label>
          <input id="new-img" className="input" type="url" placeholder="https://…" value={form.image} onChange={(e) => set('image', e.target.value)} />
        </div>
      </div>
      <div className="inline-actions">
        <button type="submit" className="btn btn--primary" disabled={saving}>{saving ? 'Création…' : 'Créer le produit'}</button>
        <button type="button" className="btn btn--secondary" onClick={onCancel}>Annuler</button>
      </div>
    </form>
  );
}

SortBtn.propTypes = {
  field: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  sortField: PropTypes.string.isRequired,
  sortDir: PropTypes.string.isRequired,
  onToggle: PropTypes.func.isRequired,
};

function SortBtn({ field, label, sortField, sortDir, onToggle }) {
  let indicator = '';
  if (sortField === field) indicator = sortDir === 'asc' ? ' ▲' : ' ▼';
  return (
    <button type="button" className="btn btn--link" onClick={() => onToggle(field)}>
      {label}{indicator}
    </button>
  );
}

EditProductForm.propTypes = {
  product: PropTypes.object.isRequired,
  categories: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.number, name: PropTypes.string })).isRequired,
  onSaved: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

function EditProductForm({ product, categories, onSaved, onCancel }) {
  const [form, setForm] = useState({
    name: product.name || '',
    description: product.description || '',
    characteristics: product.characteristics || '',
    price: product.price != null ? String(product.price) : '',
    stock: product.stock != null ? String(product.stock) : '',
    image: product.image || '',
    category_id: product.category_id != null ? String(product.category_id) : '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || form.stock === '' || !form.category_id) {
      setError('Nom, prix, stock et catégorie sont obligatoires.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await adminService.updateProduct(product.id, {
        name: form.name,
        description: form.description,
        characteristics: form.characteristics,
        price: Number.parseFloat(form.price),
        stock: Number.parseInt(form.stock, 10),
        image: form.image || null,
        category_id: Number.parseInt(form.category_id, 10),
      });
      onSaved();
    } catch (err) {
      setError(err.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="panel stack" onSubmit={handleSubmit} noValidate>
      <h3>Modifier "{product.name}"</h3>
      {error && <div className="notice notice--warning" role="alert">{error}</div>}
      <div className="form-grid">
        <div style={{ gridColumn: '1 / -1' }}>
          <label className="form-label" htmlFor="edit-name">Nom <span aria-hidden="true">*</span></label>
          <input id="edit-name" className="input" value={form.name} onChange={(e) => set('name', e.target.value)} required />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label className="form-label" htmlFor="edit-desc">Description</label>
          <textarea id="edit-desc" className="textarea" rows="3" value={form.description} onChange={(e) => set('description', e.target.value)} />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label className="form-label" htmlFor="edit-chars">Caractéristiques techniques</label>
          <textarea id="edit-chars" className="textarea" rows="2" value={form.characteristics} onChange={(e) => set('characteristics', e.target.value)} />
        </div>
        <div>
          <label className="form-label" htmlFor="edit-price">Prix (€) <span aria-hidden="true">*</span></label>
          <input id="edit-price" className="input" type="number" min="0" step="0.01" value={form.price} onChange={(e) => set('price', e.target.value)} required />
        </div>
        <div>
          <label className="form-label" htmlFor="edit-stock">Stock <span aria-hidden="true">*</span></label>
          <input id="edit-stock" className="input" type="number" min="0" value={form.stock} onChange={(e) => set('stock', e.target.value)} required />
        </div>
        <div>
          <label className="form-label" htmlFor="edit-cat">Catégorie <span aria-hidden="true">*</span></label>
          <select id="edit-cat" className="select" value={form.category_id} onChange={(e) => set('category_id', e.target.value)} required>
            <option value="">-- Choisir --</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label" htmlFor="edit-img">URL de l'image</label>
          <input id="edit-img" className="input" type="url" placeholder="https://…" value={form.image} onChange={(e) => set('image', e.target.value)} />
        </div>
      </div>
      <div className="inline-actions">
        <button type="submit" className="btn btn--primary" disabled={saving}>{saving ? 'Sauvegarde…' : 'Enregistrer'}</button>
        <button type="button" className="btn btn--secondary" onClick={onCancel}>Annuler</button>
      </div>
    </form>
  );
}

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selected, setSelected] = useState(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [editProduct, setEditProduct] = useState(null);

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
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
  };

  const filtered = products
    .filter((p) => filterCategory === 'all' || String(p.category_id) === String(filterCategory))
    .slice()
    .sort((a, b) => {
      const va = a[sortField] ?? '';
      const vb = b[sortField] ?? '';
      if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb, 'fr') : vb.localeCompare(va, 'fr');
      return sortDir === 'asc' ? Number(va) - Number(vb) : Number(vb) - Number(va);
    });

  const allSelected = filtered.length > 0 && filtered.every((p) => selected.has(p.id));
  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map((p) => p.id)));
  };
  const toggleOne = (id) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const handleDeleteSelected = async () => {
    if (!globalThis.confirm(`Supprimer ${selected.size} produit(s) ?`)) return;
    try {
      await Promise.all([...selected].map((id) => adminService.deleteProduct(id)));
      setProducts((prev) => prev.filter((p) => !selected.has(p.id)));
      setSelected(new Set());
    } catch (e) { setError(e.message); }
  };

  const handleToggleStock = async (product) => {
    const newStock = product.stock > 0 ? 0 : 10;
    try {
      await adminService.updateProduct(product.id, { stock: newStock });
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, stock: newStock } : p)));
    } catch (e) { setError(e.message); }
  };

  const handleToggleFeatured = async (product) => {
    const newFeatured = product.featured > 0 ? 0 : 1;
    try {
      await adminService.updateProduct(product.id, { featured: newFeatured });
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, featured: newFeatured } : p)));
    } catch (e) { setError(e.message); }
  };

  const handleTogglePriority = async (product) => {
    const newPriority = product.priority > 0 ? 0 : 5;
    try {
      await adminService.updateProduct(product.id, { priority: newPriority });
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, priority: newPriority } : p)));
    } catch (e) { setError(e.message); }
  };

  const handleDelete = async (product) => {
    if (!globalThis.confirm(`Supprimer "${product.name}" ?`)) return;
    try {
      await adminService.deleteProduct(product.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      setSelected((prev) => { const next = new Set(prev); next.delete(product.id); return next; });
    } catch (e) { setError(e.message); }
  };

  if (loading) return <article className="card"><div className="notice notice--info">Chargement…</div></article>;

  return (
    <article className="card stack">
      <div className="inline-actions" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <h2>Gestion des produits</h2>
        <button type="button" className="btn btn--primary" onClick={() => setShowCreate((v) => !v)}>
          {showCreate ? 'Annuler' : '+ Nouveau produit'}
        </button>
      </div>

      {error && <div className="notice notice--warning" role="alert">{error}</div>}

      {showCreate && (
        <CreateProductForm
          categories={categories}
          onCreated={() => { setShowCreate(false); load(); }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {editProduct && (
        <EditProductForm
          product={editProduct}
          categories={categories}
          onSaved={() => { setEditProduct(null); load(); }}
          onCancel={() => setEditProduct(null)}
        />
      )}

      <div className="inline-actions" style={{ flexWrap: 'wrap' }}>
        <label htmlFor="admin-filter-cat" className="form-label" style={{ marginBottom: 0 }}>Catégorie :</label>
        <select
          id="admin-filter-cat"
          className="select"
          style={{ width: 'auto' }}
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="all">Toutes</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <span className="helper-text">{filtered.length} produit(s)</span>
        {selected.size > 0 && (
          <button
            type="button"
            className="btn btn--secondary"
            style={{ color: 'var(--color-danger, #c0392b)', marginLeft: 'auto' }}
            onClick={handleDeleteSelected}
          >
            Supprimer la sélection ({selected.size})
          </button>
        )}
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Tout sélectionner"
                />
              </th>
              <th><SortBtn field="name" label="Nom" sortField={sortField} sortDir={sortDir} onToggle={toggleSort} /></th>
              <th>Catégorie</th>
              <th><SortBtn field="price" label="Prix" sortField={sortField} sortDir={sortDir} onToggle={toggleSort} /></th>
              <th><SortBtn field="stock" label="Stock" sortField={sortField} sortDir={sortDir} onToggle={toggleSort} /></th>
              <th><SortBtn field="priority" label="Priorité" sortField={sortField} sortDir={sortDir} onToggle={toggleSort} /></th>
              <th><SortBtn field="featured" label="Mis en avant" sortField={sortField} sortDir={sortDir} onToggle={toggleSort} /></th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan="8" style={{ textAlign: 'center' }}><span className="helper-text">Aucun produit.</span></td></tr>
            )}
            {filtered.map((product) => (
              <tr key={product.id} className={product.stock <= 0 ? 'row--unavailable' : ''}>
                <td>
                  <input
                    type="checkbox"
                    checked={selected.has(product.id)}
                    onChange={() => toggleOne(product.id)}
                    aria-label={`Sélectionner ${product.name}`}
                  />
                </td>
                <td>
                  <strong>{product.name}</strong>
                  <br /><span className="helper-text">{product.slug}</span>
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
                    <button type="button" className="btn btn--primary" onClick={() => { setEditProduct(product); setShowCreate(false); }}>
                      Modifier
                    </button>
                    <button type="button" className="btn btn--secondary" onClick={() => handleToggleStock(product)}>
                      {product.stock > 0 ? 'Rupture' : '+ Stock'}
                    </button>
                    <button type="button" className="btn btn--secondary" onClick={() => handleTogglePriority(product)}>
                      {product.priority > 0 ? '↓ Déprioriser' : '↑ Prioriser'}
                    </button>
                    <button type="button" className="btn btn--secondary" onClick={() => handleToggleFeatured(product)}>
                      {product.featured > 0 ? '★ Retirer' : '☆ Mettre en avant'}
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
