import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService.js';

const STATUS_LABELS = {
  new: 'Nouveau',
  in_progress: 'En cours',
  resolved: 'Résolu',
  closed: 'Fermé',
};

export default function AdminSupport() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    let mounted = true;
    adminService.listMessages().then((msgs) => {
      if (mounted) { setMessages(msgs); setLoading(false); }
    }).catch((e) => {
      if (mounted) { setError(e.message); setLoading(false); }
    });
    return () => { mounted = false; };
  }, []);

  const handleStatusChange = async (id, status) => {
    try {
      await adminService.updateMessageStatus(id, status);
      setMessages((prev) => prev.map((m) => m.id === id ? { ...m, status } : m));
    } catch (e) {
      alert(`Erreur : ${e.message}`);
    }
  };

  const filtered = filterStatus === 'all' ? messages : messages.filter((m) => m.status === filterStatus);

  return (
    <article className="card stack">
      <h2>Messages de contact</h2>

      {loading && <div className="notice notice--info">Chargement…</div>}
      {error && <div className="notice notice--warning">Erreur : {error}</div>}

      <div className="inline-actions">
        <select className="select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">Tous les statuts</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <span className="helper-text">{filtered.length} message{filtered.length === 1 ? '' : 's'}</span>
      </div>

      {!loading && filtered.length === 0 && (
        <div className="notice notice--info">Aucun message pour ce filtre.</div>
      )}

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Expéditeur</th>
              <th>Sujet</th>
              <th>Date</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((msg) => (
              <React.Fragment key={msg.id}>
                <tr>
                  <td>{msg.id}</td>
                  <td>
                    <strong>{msg.email}</strong>
                    {(msg.first_name || msg.last_name) && (
                      <span className="helper-text"> — {msg.first_name} {msg.last_name}</span>
                    )}
                  </td>
                  <td>{msg.subject || '–'}</td>
                  <td className="helper-text">{new Date(msg.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                  <td>
                    <span className={`status-pill ${msg.status === 'resolved' || msg.status === 'closed' ? 'status-pill--ok' : 'status-pill--warning'}`}>
                      {STATUS_LABELS[msg.status] || msg.status || 'Nouveau'}
                    </span>
                  </td>
                  <td>
                    <div className="inline-actions">
                      <button
                        type="button"
                        className="btn btn--secondary"
                        onClick={() => setExpanded(expanded === msg.id ? null : msg.id)}
                      >
                        {expanded === msg.id ? 'Fermer' : 'Lire'}
                      </button>
                      <select
                        className="select"
                        style={{ width: 'auto' }}
                        value={msg.status || 'new'}
                        onChange={(e) => handleStatusChange(msg.id, e.target.value)}
                      >
                        {Object.entries(STATUS_LABELS).map(([v, l]) => (
                          <option key={v} value={v}>{l}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
                {expanded === msg.id && (
                  <tr>
                    <td colSpan={6}>
                      <div className="panel stack" style={{ margin: '8px 0' }}>
                        <p style={{ whiteSpace: 'pre-wrap' }}>{msg.message}</p>
                        {msg.admin_reply && (
                          <div className="notice notice--info">
                            <strong>Réponse admin :</strong> {msg.admin_reply}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}
