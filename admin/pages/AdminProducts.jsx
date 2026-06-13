import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { adminService } from '../services/adminService.js';
import { createEventSource } from '../../frontend/services/apiClient.js';

// Valeurs initiales du formulaire de création de produit.
const EMPTY_FORM = {
  name: '', description: '', characteristics: '',
  price: '', stock: '', image: '', category_id: '',
  priority: '0', featured: '0',
};

CreateProductForm.propTypes = {
  categories: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.number, name: PropTypes.string })).isRequired,
  onCreated: PropTypes.func.isRequired, // Callback appelé après création réussie
  onCancel: PropTypes.func.isRequired,  // Callback pour fermer le formulaire sans sauvegarder
};

// Formulaire de création d'un nouveau produit.
// Valide les champs obligatoires côté client avant d'envoyer au backend.
// Paramètres :
//   categories (array)    — liste des catégories disponibles pour le select
//   onCreated  (function) — appelé après création réussie (déclenche le rechargement)
//   onCancel   (function) — ferme le formulaire
function CreateProductForm({ categories, onCreated, onCancel }) {
  const [form, setForm] = useState(EMPTY_FORM); // Données du formulaire
  const [saving, setSaving] = useState(false);  // true pendant l'appel API (désactive le bouton)
  const [error, setError] = useState('');       // Erreur de validation ou API

  // Met à jour un seul champ du formulaire sans écraser les autres.
  // Paramètres :
  //   field (string) — nom du champ
  //   value (any)    — nouvelle valeur
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
        priority: Number.parseInt(form.priority, 10) || 0,
        featured: Number.parseInt(form.featured, 10) || 0,
      });
      onCreated(); // Déclenche le rechargement de la liste dans le parent
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
        <div>
          <label className="form-label" htmlFor="new-priority">Priorité (0 = aucune)</label>
          <input id="new-priority" className="input" type="number" min="0" max="99" value={form.priority} onChange={(e) => set('priority', e.target.value)} />
        </div>
        <div>
          <label className="form-label" htmlFor="new-featured">Mis en avant — rang (0 = non)</label>
          <input id="new-featured" className="input" type="number" min="0" max="99" value={form.featured} onChange={(e) => set('featured', e.target.value)} />
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
  field: PropTypes.string.isRequired,     // Champ sur lequel ce bouton trie
  label: PropTypes.string.isRequired,     // Texte affiché dans l'en-tête
  sortField: PropTypes.string.isRequired, // Champ de tri actuellement actif
  sortDir: PropTypes.string.isRequired,   // Direction active ('asc' ou 'desc')
  onToggle: PropTypes.func.isRequired,    // Callback appelé avec `field` au clic
};

// Bouton d'en-tête de colonne avec indicateur de tri (▲ / ▼).
// Paramètres :
//   field     (string)   — champ de tri correspondant à cette colonne
//   label     (string)   — libellé de la colonne
//   sortField (string)   — champ de tri actuellement actif
//   sortDir   (string)   — direction active
//   onToggle  (function) — bascule le tri sur ce champ
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
  product: PropTypes.object.isRequired,  // Produit à modifier (données préchargées dans le form)
  categories: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.number, name: PropTypes.string })).isRequired,
  onSaved: PropTypes.func.isRequired,    // Callback après sauvegarde réussie
  onCancel: PropTypes.func.isRequired,   // Ferme le formulaire sans sauvegarder
};

// Formulaire d'édition d'un produit existant.
// Pré-remplit tous les champs depuis l'objet `product` fourni par le tableau.
function EditProductForm({ product, categories, onSaved, onCancel }) {
  const [form, setForm] = useState({
    name: product.name || '',
    description: product.description || '',
    characteristics: product.characteristics || '',
    price: product.price != null ? String(product.price) : '',
    stock: product.stock != null ? String(product.stock) : '',
    image: product.image || '',
    category_id: product.category_id != null ? String(product.category_id) : '',
    priority: product.priority != null ? String(product.priority) : '0',
    featured: product.featured != null ? String(product.featured) : '0',
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
        priority: Number.parseInt(form.priority, 10) || 0,
        featured: Number.parseInt(form.featured, 10) || 0,
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
        <div>
          <label className="form-label" htmlFor="edit-priority">
            Priorité <span className="helper-text">(0 = aucune · plus grand = plus prioritaire)</span>
          </label>
          <input id="edit-priority" className="input" type="number" min="0" max="99" value={form.priority} onChange={(e) => set('priority', e.target.value)} />
        </div>
        <div>
          <label className="form-label" htmlFor="edit-featured">
            Mis en avant <span className="helper-text">(0 = non · rang sur la page d'accueil)</span>
          </label>
          <input id="edit-featured" className="input" type="number" min="0" max="99" value={form.featured} onChange={(e) => set('featured', e.target.value)} />
        </div>
      </div>
      <div className="inline-actions">
        <button type="submit" className="btn btn--primary" disabled={saving}>{saving ? 'Sauvegarde…' : 'Enregistrer'}</button>
        <button type="button" className="btn btn--secondary" onClick={onCancel}>Annuler</button>
      </div>
    </form>
  );
}

InlineNumberCell.propTypes = {
  value: PropTypes.number.isRequired,                                       // Valeur numérique courante
  productId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onSave: PropTypes.func.isRequired,   // Appelé avec (productId, newValue) à la validation
  renderPill: PropTypes.func.isRequired, // Render prop : reçoit la valeur et retourne le JSX de la pastille
};

// Cellule de tableau avec édition inline au clic.
// En mode lecture : affiche une pastille (via renderPill).
// En mode édition (après clic) : remplace la pastille par un input numérique.
// Valide et sauvegarde au blur ou à la touche Entrée ; annule avec Escape.
function InlineNumberCell({ value, productId, onSave, renderPill }) {
  const [editing, setEditing] = useState(false); // true = mode édition (input visible)
  const [draft, setDraft] = useState('');         // Valeur en cours de frappe (string pour contrôler l'input)

  // Passe en mode édition et initialise le draft avec la valeur actuelle
  const open = () => { setDraft(String(value)); setEditing(true); };
  const cancel = () => setEditing(false);

  // Valide le draft : si c'est un entier ≥ 0, appelle onSave et ferme l'édition.
  const commit = () => {
    const num = Number.parseInt(draft, 10);
    if (!Number.isNaN(num) && num >= 0) onSave(productId, num);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        className="input"
        type="number"
        min="0"
        max="9999"
        autoFocus
        value={draft}
        style={{ width: 72 }}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}   // Sauvegarde si l'utilisateur clique ailleurs
        onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel(); }}
      />
    );
  }

  return (
    <span
      role="button"
      tabIndex={0}
      title="Cliquer pour modifier"
      style={{ cursor: 'pointer' }}
      onClick={open}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') open(); }}
    >
      {renderPill(value)}
    </span>
  );
}

// Page principale de gestion des produits.
// Affiche tous les produits dans un tableau triable et filtrable par catégorie.
// Permet la création, modification, suppression individuelle ou en lot,
// et l'édition inline du stock, de la priorité et du rang "mis en avant".
// S'abonne aux SSE pour se mettre à jour en temps réel quand un autre admin modifie un produit.
export default function AdminProducts() {
  const [products, setProducts] = useState([]);       // Tous les produits (non filtrés)
  const [categories, setCategories] = useState([]);   // Catégories déduites de la liste produits
  const [loading, setLoading] = useState(true);       // true pendant le chargement initial
  const [error, setError] = useState('');             // Erreur API
  const [sortField, setSortField] = useState('name'); // Champ de tri actif
  const [sortDir, setSortDir] = useState('asc');      // Direction du tri
  const [filterCategory, setFilterCategory] = useState('all'); // Filtre par catégorie ('all' ou id)
  const [selected, setSelected] = useState(new Set()); // Set d'ids de produits cochés (sélection multiple)
  const [showCreate, setShowCreate] = useState(false); // Affiche/masque le formulaire de création
  const [editProduct, setEditProduct] = useState(null); // Produit en cours d'édition (null = aucun)

  // Charge les produits et déduit la liste de catégories à partir des produits reçus.
  // On déduplique les catégories avec un Set pour éviter les doublons dans le select.
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

  // Abonnement SSE : rechargement silencieux de la liste produits en temps réel
  // quand un autre admin modifie un produit (création, mise à jour, suppression).
  useEffect(() => {
    const es = createEventSource('/pg/events/home');
    es.onmessage = () => {
      adminService.listProducts().then(setProducts).catch(() => {});
    };
    return () => es.close(); // Ferme la connexion SSE à la destruction du composant
  }, []);

  // Bascule le tri : même champ = inverse la direction ; nouveau champ = repart en 'asc'.
  const toggleSort = (field) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
  };

  // Produits filtrés par catégorie puis triés selon sortField et sortDir.
  const filtered = products
    .filter((p) => filterCategory === 'all' || String(p.category_id) === String(filterCategory))
    .slice()
    .sort((a, b) => {
      const va = a[sortField] ?? '';
      const vb = b[sortField] ?? '';
      if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb, 'fr') : vb.localeCompare(va, 'fr');
      return sortDir === 'asc' ? Number(va) - Number(vb) : Number(vb) - Number(va);
    });

  // allSelected : true si tous les produits filtrés sont cochés
  const allSelected = filtered.length > 0 && filtered.every((p) => selected.has(p.id));

  // Coche ou décoche tous les produits filtrés
  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map((p) => p.id)));
  };

  // Ajoute ou retire un produit de la sélection individuelle
  const toggleOne = (id) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  // Supprime (soft-delete) tous les produits cochés en parallèle.
  // Met à jour la liste locale après suppression.
  const handleDeleteSelected = async () => {
    if (!globalThis.confirm(`Supprimer ${selected.size} produit(s) ?`)) return;
    try {
      await Promise.all([...selected].map((id) => adminService.deleteProduct(id)));
      setProducts((prev) => prev.filter((p) => !selected.has(p.id)));
      setSelected(new Set());
    } catch (e) { setError(e.message); }
  };

  // Supprime un produit individuel après confirmation.
  // Paramètres :
  //   product (object) — produit à supprimer (utilisé pour l'id et le nom dans la confirmation)
  const handleDelete = async (product) => {
    if (!globalThis.confirm(`Supprimer "${product.name}" ?`)) return;
    try {
      await adminService.deleteProduct(product.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      setSelected((prev) => { const next = new Set(prev); next.delete(product.id); return next; });
    } catch (e) { setError(e.message); }
  };

  // Sauvegarde le nouveau stock via édition inline (depuis InlineNumberCell).
  const handleSaveStock = async (productId, newStock) => {
    try {
      await adminService.updateProduct(productId, { stock: newStock });
      setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, stock: newStock } : p)));
    } catch (e) { setError(e.message); }
  };

  // Sauvegarde la nouvelle priorité via édition inline.
  const handleSavePriority = async (productId, newPriority) => {
    try {
      await adminService.updateProduct(productId, { priority: newPriority });
      setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, priority: newPriority } : p)));
    } catch (e) { setError(e.message); }
  };

  // Sauvegarde le nouveau rang "mis en avant" via édition inline.
  const handleSaveFeatured = async (productId, newFeatured) => {
    try {
      await adminService.updateProduct(productId, { featured: newFeatured });
      setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, featured: newFeatured } : p)));
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

      {/* Formulaire de création affiché en accordéon */}
      {showCreate && (
        <CreateProductForm
          categories={categories}
          onCreated={() => { setShowCreate(false); load(); }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {/* Formulaire d'édition — s'affiche sous les filtres quand editProduct !== null */}
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
        <select id="admin-filter-cat" className="select" style={{ width: 'auto' }} value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="all">Toutes</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <span className="helper-text">{filtered.length} produit(s)</span>
        {selected.size > 0 && (
          <button type="button" className="btn btn--secondary" style={{ color: 'var(--color-danger, #c0392b)', marginLeft: 'auto' }} onClick={handleDeleteSelected}>
            Supprimer la sélection ({selected.size})
          </button>
        )}
      </div>

      <p className="helper-text" style={{ marginTop: 0 }}>
        Cliquez sur les valeurs <strong>Stock</strong>, <strong>Priorité</strong> ou <strong>Mis en avant</strong> pour les modifier directement.
      </p>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th><input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Tout sélectionner" /></th>
              <th><SortBtn field="name" label="Nom" sortField={sortField} sortDir={sortDir} onToggle={toggleSort} /></th>
              <th><SortBtn field="category_name" label="Catégorie" sortField={sortField} sortDir={sortDir} onToggle={toggleSort} /></th>
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
              // Ligne en grisé si le produit est en rupture de stock
              <tr key={product.id} className={product.stock <= 0 ? 'row--unavailable' : ''}>
                <td>
                  <input type="checkbox" checked={selected.has(product.id)} onChange={() => toggleOne(product.id)} aria-label={`Sélectionner ${product.name}`} />
                </td>
                <td>
                  <strong>{product.name}</strong>
                  <br /><span className="helper-text">{product.slug}</span>
                </td>
                <td>{product.category_name || '—'}</td>
                <td>{Number(product.price).toFixed(2)} €</td>

                {/* Stock — pastille verte/rouge avec édition inline au clic */}
                <td>
                  <InlineNumberCell
                    value={Number(product.stock) || 0}
                    productId={product.id}
                    onSave={handleSaveStock}
                    renderPill={(v) => (
                      <span className={`status-pill ${v > 0 ? 'status-pill--ok' : 'status-pill--danger'}`}>
                        {v > 0 ? `${v} en stock` : 'Rupture'}
                      </span>
                    )}
                  />
                </td>

                {/* Priorité — # affiché seulement si > 0, sinon tiret */}
                <td>
                  <InlineNumberCell
                    value={Number(product.priority) || 0}
                    productId={product.id}
                    onSave={handleSavePriority}
                    renderPill={(v) => v > 0
                      ? <span className="status-pill status-pill--warning">#{v}</span>
                      : <span className="helper-text">–</span>}
                  />
                </td>

                {/* Mis en avant — étoile + rang si > 0, tiret sinon */}
                <td>
                  <InlineNumberCell
                    value={Number(product.featured) || 0}
                    productId={product.id}
                    onSave={handleSaveFeatured}
                    renderPill={(v) => v > 0
                      ? <span className="status-pill status-pill--ok">★ {v}</span>
                      : <span className="helper-text">–</span>}
                  />
                </td>

                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" className="btn btn--primary" style={{ fontSize: '0.82rem', padding: '6px 14px' }} onClick={() => { setEditProduct(product); setShowCreate(false); }}>
                      Modifier
                    </button>
                    <button type="button" className="btn btn--secondary" style={{ fontSize: '0.82rem', padding: '6px 14px', color: 'var(--color-danger, #c0392b)' }} onClick={() => handleDelete(product)}>
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
