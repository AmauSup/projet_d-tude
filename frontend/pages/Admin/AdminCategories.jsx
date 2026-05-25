import React, { useState } from 'react';
import { adminService } from '../../services/adminService.js';

const EMPTY_FORM = { name: '', description: '', image_url: '', order_index: 0 };

export default function AdminCategories({ categories = [], onSetCategoryOrder, onCategoriesChange }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [feedback, setFeedback] = useState('');

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFeedback('');
    setShowForm(true);
  };

  const openEdit = (cat) => {
    setEditingId(cat.id);
    setForm({ name: cat.name || '', description: cat.description || '', image_url: cat.imageUrl || '', order_index: cat.displayOrder || 0 });
    setFeedback('');
    setShowForm(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Supprimer la catégorie "${name}" ? Tous les produits liés devront être réassignés.`)) return;
    try {
      await adminService.deleteCategory(id);
      setFeedback(`Catégorie "${name}" supprimée.`);
      onCategoriesChange?.();
    } catch (e) {
      setFeedback(`Erreur : ${e.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) { setFeedback('Le nom est obligatoire.'); return; }
    try {
      if (editingId) {
        await adminService.updateCategory(editingId, form);
        setFeedback('Catégorie mise à jour.');
      } else {
        await adminService.createCategory(form);
        setFeedback('Catégorie créée.');
      }
      setShowForm(false);
      onCategoriesChange?.();
    } catch (err) {
      setFeedback(`Erreur : ${err.message}`);
    }
  };

  return (
    <article className="card stack">
      <div className="inline-actions" style={{ justifyContent: 'space-between' }}>
        <h2>Gestion des catégories</h2>
        <button type="button" className="btn btn--primary" onClick={openCreate}>+ Nouvelle catégorie</button>
      </div>
      <span className="helper-text">{categories.length} catégorie(s)</span>

      {feedback && <div className="notice notice--info">{feedback}</div>}

      {showForm && (
        <div className="panel stack">
          <h3>{editingId ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <input className="input" placeholder="Nom *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <input className="input" type="number" min="0" placeholder="Ordre d'affichage" value={form.order_index} onChange={(e) => setForm({ ...form, order_index: Number(e.target.value) })} />
              <input className="input" placeholder="URL image" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
            </div>
            <textarea className="input" style={{ width: '100%', minHeight: 60, marginTop: 8 }} placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="inline-actions" style={{ marginTop: 12 }}>
              <button type="submit" className="btn btn--primary">{editingId ? 'Enregistrer' : 'Créer'}</button>
              <button type="button" className="btn btn--secondary" onClick={() => setShowForm(false)}>Annuler</button>
            </div>
          </form>
        </div>
      )}

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Slug</th>
              <th>Description</th>
              <th>Ordre</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {[...categories]
              .sort((a, b) => a.displayOrder - b.displayOrder)
              .map((category) => (
                <tr key={category.id}>
                  <td>
                    <strong>{category.name}</strong>
                    {category.imageUrl && <span className="helper-text"> 🖼</span>}
                  </td>
                  <td><span className="helper-text">{category.slug}</span></td>
                  <td>{category.description}</td>
                  <td>
                    <input
                      className="input"
                      style={{ width: '5rem' }}
                      type="number"
                      min="1"
                      value={category.displayOrder}
                      onChange={(e) => onSetCategoryOrder(category.id, e.target.value)}
                      aria-label={`Ordre de la catégorie ${category.name}`}
                    />
                  </td>
                  <td>
                    <div className="inline-actions">
                      <button type="button" className="btn btn--secondary" onClick={() => openEdit(category)}>✏️ Modifier</button>
                      <button type="button" className="btn btn--secondary" style={{ color: 'var(--color-danger, #c0392b)' }} onClick={() => handleDelete(category.id, category.name)}>🗑 Supprimer</button>
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
