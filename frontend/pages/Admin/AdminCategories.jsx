import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService.js';

const EMPTY_FORM = { name: '', description: '', image_url: '', order_index: 0 };

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = () => {
    setLoading(true);
    adminService.listCategories()
      .then((cats) => { setCategories(cats); setLoading(false); })
      .catch((e) => { setError(e.message || 'Erreur chargement'); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (cat) => {
    setEditTarget(cat);
    setForm({
      name: cat.name || '',
      description: cat.description || '',
      image_url: cat.image_url || '',
      order_index: cat.order_index ?? 0,
    });
    setFormError('');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setFormError('Le nom est obligatoire.'); return; }
    setSaving(true);
    setFormError('');
    try {
      if (editTarget) {
        await adminService.updateCategory(editTarget.id, {
          name: form.name.trim(),
          description: form.description.trim(),
          image_url: form.image_url.trim(),
          order_index: Number(form.order_index) || 0,
        });
        setFeedback(`Catégorie "${form.name}" mise à jour.`);
      } else {
        await adminService.createCategory({
          name: form.name.trim(),
          description: form.description.trim(),
          image_url: form.image_url.trim(),
          order_index: Number(form.order_index) || 0,
        });
        setFeedback(`Catégorie "${form.name}" créée.`);
      }
      setShowForm(false);
      setEditTarget(null);
      load();
    } catch (err) {
      setFormError(err.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat) => {
    if (!globalThis.confirm(`Supprimer la catégorie "${cat.name}" ? Cette action est irréversible. Les produits liés doivent être réaffectés au préalable.`)) return;
    try {
      await adminService.deleteCategory(cat.id);
      setFeedback(`Catégorie "${cat.name}" supprimée.`);
      load();
    } catch (err) {
      setFeedback(`Erreur : ${err.message}`);
    }
  };

  const sorted = [...categories].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

  let submitLabel = 'Créer';
  if (saving) submitLabel = 'Sauvegarde…';
  else if (editTarget) submitLabel = 'Mettre à jour';

  return (
    <article className="card stack">
      <div className="inline-actions" style={{ justifyContent: 'space-between' }}>
        <div>
          <h2>Gestion des catégories</h2>
          <span className="helper-text">{categories.length} catégorie(s)</span>
        </div>
        <button type="button" className="btn btn--primary" onClick={openCreate}>+ Nouvelle catégorie</button>
      </div>

      {loading && <div className="notice notice--info">Chargement…</div>}
      {error && <div className="notice notice--warning">Erreur : {error}</div>}
      {feedback && <div className="notice notice--info">{feedback}</div>}

      {showForm && (
        <form className="panel stack" onSubmit={handleSubmit} noValidate>
          <h3>{editTarget ? `Modifier "${editTarget.name}"` : 'Nouvelle catégorie'}</h3>
          {formError && <div className="notice notice--warning" role="alert">{formError}</div>}

          <div className="form-grid">
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label" htmlFor="cat-name">Nom <span aria-hidden="true">*</span></label>
              <input
                id="cat-name"
                className="input"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                required
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label" htmlFor="cat-desc">Description</label>
              <textarea
                id="cat-desc"
                className="textarea"
                rows={3}
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label" htmlFor="cat-img">URL de l'image</label>
              <input
                id="cat-img"
                className="input"
                type="url"
                placeholder="https://…"
                value={form.image_url}
                onChange={(e) => set('image_url', e.target.value)}
              />
              {form.image_url && (
                <img
                  src={form.image_url}
                  alt="Aperçu"
                  style={{ marginTop: 8, maxHeight: 100, borderRadius: 6, objectFit: 'cover' }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              )}
            </div>

            <div>
              <label className="form-label" htmlFor="cat-order">Ordre d'affichage</label>
              <input
                id="cat-order"
                className="input"
                type="number"
                min="0"
                value={form.order_index}
                onChange={(e) => set('order_index', e.target.value)}
              />
            </div>
          </div>

          <div className="inline-actions">
            <button type="submit" className="btn btn--primary" disabled={saving}>{submitLabel}</button>
            <button type="button" className="btn btn--secondary" onClick={() => { setShowForm(false); setEditTarget(null); }}>Annuler</button>
          </div>
        </form>
      )}

      {!loading && (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Nom</th>
                <th>Slug</th>
                <th>Description</th>
                <th>Ordre</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 24 }} className="helper-text">
                    Aucune catégorie.
                  </td>
                </tr>
              ) : sorted.map((cat) => (
                <tr key={cat.id}>
                  <td>
                    {cat.image_url ? (
                      <img
                        src={cat.image_url}
                        alt={cat.name}
                        style={{ width: 48, height: 36, objectFit: 'cover', borderRadius: 4 }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <span className="helper-text" style={{ fontSize: '0.75rem' }}>Aucune</span>
                    )}
                  </td>
                  <td><strong>{cat.name}</strong></td>
                  <td><span className="helper-text">{cat.slug}</span></td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {cat.description || <span className="helper-text">—</span>}
                  </td>
                  <td>{cat.order_index ?? 0}</td>
                  <td>
                    <div className="inline-actions" style={{ gap: 6 }}>
                      <button type="button" className="btn btn--secondary" style={{ fontSize: '0.8rem', padding: '3px 10px' }} onClick={() => openEdit(cat)}>
                        Modifier
                      </button>
                      <button
                        type="button"
                        className="btn"
                        style={{ fontSize: '0.8rem', padding: '3px 10px', background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' }}
                        onClick={() => handleDelete(cat)}
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
      )}
    </article>
  );
}
