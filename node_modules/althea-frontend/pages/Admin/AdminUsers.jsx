import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService.js';

const EMPTY_FORM = { email: '', password: '', first_name: '', last_name: '', is_admin: false };

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const load = () => {
    setLoading(true);
    adminService.listUsers().then((u) => { setUsers(u); setLoading(false); }).catch((e) => { setError(e.message); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const filtered = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return !q || u.email?.toLowerCase().includes(q) || u.first_name?.toLowerCase().includes(q) || u.last_name?.toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDelete = async (id, email) => {
    if (!window.confirm(`Désactiver le compte "${email}" ?`)) return;
    try {
      await adminService.deleteUser(id);
      setFeedback(`Compte "${email}" désactivé.`);
      load();
    } catch (e) {
      setFeedback(`Erreur : ${e.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { setFeedback('Email et mot de passe obligatoires.'); return; }
    try {
      await adminService.createUser(form);
      setFeedback('Utilisateur créé.');
      setShowForm(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      setFeedback(`Erreur : ${err.message}`);
    }
  };

  return (
    <article className="card stack">
      <div className="inline-actions" style={{ justifyContent: 'space-between' }}>
        <h2>Gestion des utilisateurs</h2>
        <button type="button" className="btn btn--primary" onClick={() => { setShowForm(true); setForm(EMPTY_FORM); setFeedback(''); }}>+ Nouvel utilisateur</button>
      </div>

      {loading && <div className="notice notice--info">Chargement…</div>}
      {error && <div className="notice notice--warning">Erreur : {error}</div>}
      {feedback && <div className="notice notice--info">{feedback}</div>}

      {showForm && (
        <div className="panel stack">
          <h3>Nouvel utilisateur</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <input className="input" placeholder="Prénom" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
              <input className="input" placeholder="Nom" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
              <input className="input" type="email" placeholder="Email *" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              <input className="input" type="password" placeholder="Mot de passe *" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <input type="checkbox" checked={form.is_admin} onChange={(e) => setForm({ ...form, is_admin: e.target.checked })} />
              Compte administrateur
            </label>
            <div className="inline-actions" style={{ marginTop: 12 }}>
              <button type="submit" className="btn btn--primary">Créer</button>
              <button type="button" className="btn btn--secondary" onClick={() => setShowForm(false)}>Annuler</button>
            </div>
          </form>
        </div>
      )}

      <input
        className="input"
        style={{ maxWidth: 300 }}
        placeholder="Rechercher (email, nom…)"
        value={searchQuery}
        onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
      />
      <span className="helper-text">{filtered.length} utilisateur(s)</span>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Nom</th>
              <th>Email</th>
              <th>Rôle</th>
              <th>Inscrit le</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.first_name} {u.last_name}</td>
                <td>{u.email}</td>
                <td>
                  <span className={`status-pill ${u.is_admin ? 'status-pill--warning' : 'status-pill--ok'}`}>
                    {u.is_admin ? 'Admin' : 'Client'}
                  </span>
                </td>
                <td className="helper-text">{new Date(u.created_at).toLocaleDateString('fr-FR')}</td>
                <td>
                  <button
                    type="button"
                    className="btn btn--secondary"
                    style={{ color: 'var(--color-danger, #c0392b)' }}
                    onClick={() => handleDelete(u.id, u.email)}
                  >
                    🗑 Désactiver
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <nav className="pagination" aria-label="Pagination utilisateurs">
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
