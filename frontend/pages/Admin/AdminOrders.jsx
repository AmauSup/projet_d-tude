import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService.js';

const STATUS_OPTIONS = ['En préparation', 'Confirmée', 'Expédiée', 'Livrée', 'Annulée'];

const STATUS_CLASS = {
  'En préparation': 'status-pill--warning',
  'Confirmée': 'status-pill--info',
  'Expédiée': 'status-pill--ok',
  'Livrée': 'status-pill--ok',
  'Annulée': 'status-pill--danger',
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [sortField, setSortField] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');

  useEffect(() => {
    adminService.listOrders()
      .then((o) => setOrders(o))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sorted = [...orders].sort((a, b) => {
    const va = a[sortField] ?? '';
    const vb = b[sortField] ?? '';
    if (typeof va === 'string') {
      return sortDir === 'asc' ? va.localeCompare(vb, 'fr') : vb.localeCompare(va, 'fr');
    }
    return sortDir === 'asc' ? Number(va) - Number(vb) : Number(vb) - Number(va);
  });

  const sortIndicator = (field) => (sortField === field ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '');

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      await adminService.updateOrderStatus(orderId, newStatus);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
    } catch (e) {
      setError(e.message);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <article className="card"><div className="notice notice--info">Chargement…</div></article>;

  return (
    <article className="card stack">
      <h2>Gestion des commandes</h2>
      {error && <div className="notice notice--warning" role="alert">{error}</div>}
      <span className="helper-text">{orders.length} commande(s)</span>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>
                <button type="button" className="btn btn--link" onClick={() => toggleSort('id')}>
                  N°{sortIndicator('id')}
                </button>
              </th>
              <th>
                <button type="button" className="btn btn--link" onClick={() => toggleSort('first_name')}>
                  Client{sortIndicator('first_name')}
                </button>
              </th>
              <th>
                <button type="button" className="btn btn--link" onClick={() => toggleSort('created_at')}>
                  Date{sortIndicator('created_at')}
                </button>
              </th>
              <th>
                <button type="button" className="btn btn--link" onClick={() => toggleSort('total_amount')}>
                  Total{sortIndicator('total_amount')}
                </button>
              </th>
              <th>
                <button type="button" className="btn btn--link" onClick={() => toggleSort('status')}>
                  Statut{sortIndicator('status')}
                </button>
              </th>
              <th>Détails</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center' }}>
                  <span className="helper-text">Aucune commande.</span>
                </td>
              </tr>
            )}
            {sorted.map((order) => (
              <React.Fragment key={order.id}>
                <tr>
                  <td><strong>#{order.id}</strong></td>
                  <td>
                    {order.first_name ? `${order.first_name} ${order.last_name}` : order.email || '—'}
                  </td>
                  <td className="helper-text">
                    {order.created_at ? String(order.created_at).slice(0, 10) : '—'}
                  </td>
                  <td><strong>{Number(order.total_amount).toFixed(2)} €</strong></td>
                  <td>
                    <select
                      className="select"
                      style={{ width: 'auto', fontSize: '0.82rem', padding: '6px 8px' }}
                      value={order.status}
                      disabled={updatingId === order.id}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      aria-label={`Statut commande ${order.id}`}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn--secondary"
                      onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                      aria-expanded={expanded === order.id}
                    >
                      {expanded === order.id ? 'Fermer' : 'Détails'}
                    </button>
                  </td>
                </tr>
                {expanded === order.id && (
                  <tr>
                    <td colSpan="6">
                      <div className="panel stack">
                        <div className="inline-actions" style={{ justifyContent: 'space-between' }}>
                          <h4>Commande #{order.id}</h4>
                          <span className={`status-pill ${STATUS_CLASS[order.status] || ''}`}>
                            {order.status}
                          </span>
                        </div>
                        {order.billing_address && (
                          <p>
                            Adresse :{' '}
                            {typeof order.billing_address === 'object'
                              ? `${order.billing_address.address1 || ''}, ${order.billing_address.city || ''}`
                              : order.billing_address}
                          </p>
                        )}
                        {order.payment_summary && <p>Paiement : {order.payment_summary}</p>}
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
