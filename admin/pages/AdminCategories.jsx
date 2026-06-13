import React, { useEffect, useState } from 'react';
import { adminService } from '../services/adminService.js';
import { createEventSource } from '../../frontend/services/apiClient.js';

// Valeurs initiales du formulaire création / édition de catégorie.
// Réutilisé pour remettre le formulaire à zéro après soumission ou annulation.
const EMPTY_FORM = { name: '', description: '', image_url: '' };

// Page de gestion des catégories.
// Permet de créer, modifier, supprimer et réordonner les catégories,
// ainsi que de basculer leur visibilité sur la page d'accueil.
// Se synchronise en temps réel via SSE pour refléter les modifications d'autres admins.
export default function AdminCategories() {
  const [categories, setCategories] = useState([]);   // Toutes les catégories (y compris masquées)
  const [loading, setLoading] = useState(true);        // true pendant le chargement initial
  const [error, setError] = useState('');              // Erreur de chargement API
  const [feedback, setFeedback] = useState('');        // Message de confirmation d'action (création, suppression…)
  const [showForm, setShowForm] = useState(false);     // true = formulaire création/édition visible
  const [editTarget, setEditTarget] = useState(null);  // Catégorie en cours d'édition (null = mode création)
  const [form, setForm] = useState(EMPTY_FORM);        // Données du formulaire
  const [saving, setSaving] = useState(false);         // true pendant l'appel API de sauvegarde
  const [formError, setFormError] = useState('');      // Erreur de validation du formulaire

  // Charge (ou recharge) toutes les catégories depuis l'API admin.
  // Appelé au montage et après chaque création / modification / suppression.
  const load = () => {
    setLoading(true);
    adminService.listCategories()
      .then((cats) => { setCategories(cats); setLoading(false); })
      .catch((e) => { setError(e.message || 'Erreur chargement'); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  // Abonnement SSE : rechargement silencieux quand un autre admin modifie les catégories.
  // Le cleanup (es.close()) est essentiel pour éviter les fuites mémoire.
  useEffect(() => {
    const es = createEventSource('/pg/events/home');
    es.onmessage = () => {
      adminService.listCategories().then(setCategories).catch(() => {});
    };
    return () => es.close();
  }, []);

  // Met à jour un seul champ du formulaire sans écraser les autres.
  // Paramètres :
  //   field (string) — nom du champ
  //   value (any)    — nouvelle valeur
  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  // Ouvre le formulaire en mode création.
  // Remet le formulaire à zéro et efface la cible d'édition.
  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowForm(true);
  };

  // Ouvre le formulaire en mode édition, pré-rempli avec les données de la catégorie.
  // Paramètres :
  //   cat (object) — catégorie à éditer
  const openEdit = (cat) => {
    setEditTarget(cat);
    setForm({
      name: cat.name || '',
      description: cat.description || '',
      image_url: cat.image_url || '',
    });
    setFormError('');
    setShowForm(true);
  };

  // Soumet le formulaire : crée ou met à jour la catégorie selon editTarget.
  // Si editTarget est null → création ; sinon → mise à jour de la catégorie ciblée.
  // L'order_index des nouvelles catégories est initialisé à la longueur de la liste actuelle
  // (position en dernier dans l'ordre d'affichage).
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
        });
        setFeedback(`Catégorie "${form.name}" mise à jour.`);
      } else {
        await adminService.createCategory({
          name: form.name.trim(),
          description: form.description.trim(),
          image_url: form.image_url.trim(),
          order_index: categories.length, // Positionnée en dernier par défaut
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

  // Bascule la visibilité de la catégorie sur la page d'accueil (visible ↔ masqué).
  // Optimistic update : met à jour l'état local immédiatement sans attendre l'API.
  // Si l'API échoue, on recharge depuis le serveur pour remettre l'état cohérent.
  // Paramètres :
  //   cat (object) — catégorie à basculer (utilisée pour l'id, le nom et l'état visible courant)
  const handleToggleVisible = async (cat) => {
    const newVisible = cat.visible === false; // false ou undefined/null → passe à true
    setCategories((prev) => prev.map((c) => c.id === cat.id ? { ...c, visible: newVisible } : c));
    try {
      await adminService.setCategoryVisible(cat.id, newVisible);
      setFeedback(`Catégorie "${cat.name}" ${newVisible ? 'affichée' : 'masquée'} sur l'accueil.`);
    } catch (e) {
      setFeedback(`Erreur : ${e.message}`);
      load(); // Rollback : recharge depuis le serveur en cas d'échec
    }
  };

  // Supprime définitivement une catégorie après confirmation.
  // Attention : les produits liés à cette catégorie doivent être réaffectés au préalable
  // car la suppression peut échouer si des produits y sont encore rattachés (contrainte FK).
  // Paramètres :
  //   cat (object) — catégorie à supprimer
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

  // Réordonne les catégories en échangeant deux éléments adjacents (déplacement haut/bas).
  // Algorithme :
  //   1. Trie la liste par order_index (ordre stable avant échange)
  //   2. Échange les deux éléments aux positions idx et targetIdx
  //   3. Réassigne des index séquentiels 0,1,2… (évite les doublons ou les trous)
  //   4. Sauvegarde tous les order_index en parallèle via Promise.all
  // Paramètres :
  //   cat (object) — catégorie à déplacer
  //   dir (string) — 'up' ou 'down'
  const handleMove = async (cat, dir) => {
    const list = [...categories].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
    const idx = list.findIndex((c) => c.id === cat.id);
    const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return; // Déjà au bord, rien à faire
    const reordered = [...list];
    [reordered[idx], reordered[targetIdx]] = [reordered[targetIdx], reordered[idx]]; // Échange
    const withIndices = reordered.map((c, i) => ({ ...c, order_index: i })); // Réindexation
    setCategories(withIndices); // Mise à jour locale immédiate (optimistic)
    try {
      await Promise.all(withIndices.map((c) => adminService.updateCategory(c.id, { order_index: c.order_index })));
    } catch (e) {
      setFeedback(`Erreur : ${e.message}`);
      load(); // Rollback
    }
  };

  // Catégories triées par order_index pour l'affichage dans le tableau.
  // Calculé à chaque rendu depuis le state (pas de mémo car peu coûteux).
  const sorted = [...categories].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

  // Libellé dynamique du bouton de soumission selon l'état du formulaire
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

      {/* Formulaire création / édition (affiché en accordéon quand showForm=true) */}
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
              {/* Aperçu en direct de l'image saisie. Masqué si l'URL est cassée (onError). */}
              {form.image_url && (
                <img
                  src={form.image_url}
                  alt="Aperçu"
                  style={{ marginTop: 8, maxHeight: 100, borderRadius: 6, objectFit: 'cover' }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              )}
            </div>
          </div>

          <div className="inline-actions">
            <button type="submit" className="btn btn--primary" disabled={saving}>{submitLabel}</button>
            <button type="button" className="btn btn--secondary" onClick={() => { setShowForm(false); setEditTarget(null); }}>Annuler</button>
          </div>
        </form>
      )}

      {/* Tableau des catégories — affiché une fois le chargement terminé */}
      {!loading && (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Position</th>
                <th>Image</th>
                <th>Nom</th>
                <th>Slug</th>
                <th>Description</th>
                <th>Accueil</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 24 }} className="helper-text">
                    Aucune catégorie.
                  </td>
                </tr>
              ) : sorted.map((cat, idx) => (
                <tr key={cat.id}>
                  {/* Colonne position : boutons ▲ / ▼ + numéro d'ordre */}
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <div className="inline-actions" style={{ gap: 2 }}>
                      <button
                        type="button"
                        className="btn btn--secondary"
                        style={{ fontSize: '0.8rem', padding: '2px 7px', lineHeight: 1 }}
                        disabled={idx === 0} // Désactivé si déjà en première position
                        onClick={() => handleMove(cat, 'up')}
                        aria-label="Monter"
                      >▲</button>
                      <button
                        type="button"
                        className="btn btn--secondary"
                        style={{ fontSize: '0.8rem', padding: '2px 7px', lineHeight: 1 }}
                        disabled={idx === sorted.length - 1} // Désactivé si déjà en dernière position
                        onClick={() => handleMove(cat, 'down')}
                        aria-label="Descendre"
                      >▼</button>
                      <span className="helper-text" style={{ fontSize: '0.78rem', minWidth: 18, textAlign: 'center' }}>{idx + 1}</span>
                    </div>
                  </td>

                  {/* Miniature de l'image, masquée si l'URL est cassée */}
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

                  {/* Bouton visibilité : rouge si masqué, secondaire si visible */}
                  <td>
                    <button
                      type="button"
                      className={`btn ${cat.visible === false ? 'btn--danger' : 'btn--secondary'}`}
                      style={{ fontSize: '0.8rem', padding: '3px 10px', whiteSpace: 'nowrap' }}
                      onClick={() => handleToggleVisible(cat)}
                    >
                      {cat.visible === false ? 'Masqué' : 'Visible'}
                    </button>
                  </td>

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
