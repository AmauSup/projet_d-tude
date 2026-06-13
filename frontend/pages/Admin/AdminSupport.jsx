import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService.js';

const STATUS_OPTIONS = ['new', 'read', 'replied', 'closed'];
const STATUS_LABELS = { new: 'Nouveau', read: 'Lu', replied: 'Répondu', closed: 'Fermé' };
const STATUS_CLASSES = { new: 'status-pill--danger', read: 'status-pill--info', replied: 'status-pill--ok', closed: '' };

const PAGE_SIZE = 10;

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AdminSupport() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [selected, setSelected] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQ, setSearchQ] = useState('');
  const [page, setPage] = useState(1);

  const load = () => {
    setLoading(true);
    adminService.listContactMessages()
      .then((msgs) => { setMessages(msgs); setLoading(false); })
      .catch((e) => { setError(e.message || 'Erreur de chargement'); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const filtered = messages.filter((m) => {
    if (filterStatus !== 'all' && m.status !== filterStatus) return false;
    const q = searchQ.toLowerCase();
    if (!q) return true;
    return (
      m.email?.toLowerCase().includes(q) ||
      m.name?.toLowerCase().includes(q) ||
      m.subject?.toLowerCase().includes(q) ||
      m.message?.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openMessage = async (msg) => {
    setSelected(msg);
    setReplyText(msg.admin_reply || '');
    if (msg.status === 'new') {
      try {
        await adminService.updateMessageStatus(msg.id, 'read');
        setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, status: 'read' } : m));
        setSelected((prev) => prev ? { ...prev, status: 'read' } : prev);
      } catch {}
    }
  };

  const handleSaveReply = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const result = await adminService.updateMessageStatus(selected.id, 'replied', replyText);
      setMessages((prev) => prev.map((m) => m.id === selected.id ? { ...m, status: 'replied', admin_reply: replyText } : m));
      setSelected((prev) => prev ? { ...prev, status: 'replied', admin_reply: replyText } : prev);
      setFeedback(result?.email_sent ? 'Réponse sauvegardée et e-mail envoyé.' : 'Réponse sauvegardée.');
    } catch (e) {
      setFeedback(`Erreur : ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer définitivement ce message ?')) return;
    try {
      await adminService.deleteMessage(id);
      setMessages((prev) => prev.filter((m) => m.id !== id));
      if (selected?.id === id) setSelected(null);
      setFeedback('Message supprimé.');
    } catch (e) {
      setFeedback(`Erreur : ${e.message}`);
    }
  };

  const handleClose = async (id) => {
    try {
      await adminService.updateMessageStatus(id, 'closed');
      setMessages((prev) => prev.map((m) => m.id === id ? { ...m, status: 'closed' } : m));
      if (selected?.id === id) setSelected((prev) => prev ? { ...prev, status: 'closed' } : prev);
      setFeedback('Message marqué comme fermé.');
    } catch (e) {
      setFeedback(`Erreur : ${e.message}`);
    }
  };

  const newCount = messages.filter((m) => m.status === 'new').length;

  return (
    <article className="card stack">
      <div className="inline-actions" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2>Support & Messages</h2>
          {newCount > 0 && (
            <span className="status-pill status-pill--danger" style={{ marginLeft: 8 }}>{newCount} nouveau{newCount > 1 ? 'x' : ''}</span>
          )}
        </div>
        <button type="button" className="btn btn--secondary" onClick={load}>Actualiser</button>
      </div>

      {loading && <div className="notice notice--info">Chargement…</div>}
      {error && <div className="notice notice--warning">Erreur : {error}</div>}
      {feedback && <div className="notice notice--info">{feedback}</div>}

      <div className="inline-actions" style={{ flexWrap: 'wrap', gap: 8 }}>
        <input
          className="input"
          style={{ flex: 1, minWidth: 180 }}
          placeholder="Rechercher (email, sujet, message…)"
          value={searchQ}
          onChange={(e) => { setSearchQ(e.target.value); setPage(1); }}
        />
        <select
          className="select"
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
        >
          <option value="all">Tous les statuts</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {!loading && (
        <div className="stack">
          {/* Liste des messages */}
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Expéditeur</th>
                  <th>Sujet</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24 }} className="helper-text">Aucun message.</td></tr>
                ) : paginated.map((msg) => (
                  <tr
                    key={msg.id}
                    className={selected?.id === msg.id ? 'is-selected' : ''}
                    style={{ cursor: 'pointer', fontWeight: msg.status === 'new' ? 700 : 400 }}
                    onClick={() => openMessage(msg)}
                  >
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.82rem' }}>{formatDate(msg.created_at)}</td>
                    <td>
                      <div>{msg.name || msg.first_name ? `${msg.first_name || ''} ${msg.last_name || msg.name || ''}`.trim() : '—'}</div>
                      <div className="helper-text" style={{ fontSize: '0.78rem' }}>{msg.email}</div>
                    </td>
                    <td>{msg.subject || '—'}</td>
                    <td>
                      <span className={`status-pill ${STATUS_CLASSES[msg.status] || ''}`}>
                        {STATUS_LABELS[msg.status] || msg.status}
                      </span>
                    </td>
                    <td>
                      <div className="inline-actions" style={{ gap: 4 }}>
                        {msg.status !== 'closed' && (
                          <button
                            type="button"
                            className="btn btn--secondary"
                            style={{ fontSize: '0.78rem', padding: '2px 8px' }}
                            onClick={(e) => { e.stopPropagation(); handleClose(msg.id); }}
                          >
                            Fermer
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn--danger"
                          style={{ fontSize: '0.78rem', padding: '2px 8px' }}
                          onClick={(e) => { e.stopPropagation(); handleDelete(msg.id); }}
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="inline-actions" style={{ justifyContent: 'center', marginTop: 8 }}>
                <button type="button" className="btn btn--secondary" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>‹ Préc.</button>
                <span className="helper-text">Page {page} / {totalPages}</span>
                <button type="button" className="btn btn--secondary" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Suiv. ›</button>
              </div>
            )}
          </div>

          {/* Détail du message sélectionné */}
          {selected && (
            <div className="panel stack" style={{ maxHeight: 600, overflowY: 'auto' }}>
              <div className="inline-actions" style={{ justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0 }}>Détail du message</h3>
                <button type="button" className="btn btn--secondary" style={{ fontSize: '0.8rem' }} onClick={() => setSelected(null)}>✕ Fermer</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', fontSize: '0.88rem' }}>
                <div><span className="helper-text">De :</span> <strong>{selected.name || `${selected.first_name || ''} ${selected.last_name || ''}`.trim() || '—'}</strong></div>
                <div><span className="helper-text">Email :</span> <a href={`mailto:${selected.email}`}>{selected.email}</a></div>
                <div><span className="helper-text">Sujet :</span> {selected.subject || '—'}</div>
                <div><span className="helper-text">Statut :</span> <span className={`status-pill ${STATUS_CLASSES[selected.status] || ''}`}>{STATUS_LABELS[selected.status] || selected.status}</span></div>
                <div style={{ gridColumn: '1 / -1' }}><span className="helper-text">Reçu le :</span> {formatDate(selected.created_at)}</div>
              </div>

              <div className="panel admin-message-body">
                <p className="helper-text" style={{ marginBottom: 4 }}>Message :</p>
                <p style={{ whiteSpace: 'pre-wrap', margin: 0, fontSize: '0.9rem' }}>{selected.message}</p>
              </div>

              <div className="stack">
                <label className="form-label" htmlFor="admin-reply">Réponse admin</label>
                <textarea
                  id="admin-reply"
                  className="textarea"
                  rows={5}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Saisir votre réponse…"
                />
                <div className="inline-actions">
                  <button type="button" className="btn btn--primary" disabled={saving || !replyText.trim()} onClick={handleSaveReply}>
                    {saving ? 'Envoi…' : 'Sauvegarder la réponse'}
                  </button>
                  {selected.status !== 'closed' && (
                    <button type="button" className="btn btn--secondary" onClick={() => handleClose(selected.id)}>Marquer fermé</button>
                  )}
                  <button type="button" className="btn btn--danger" onClick={() => handleDelete(selected.id)}>Supprimer</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
