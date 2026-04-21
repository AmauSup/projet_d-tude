import React, { useState } from 'react';
import { formatPrice } from '../../utils/storefront.js';

const STATUS_OPTIONS = [
  'À confirmer côté paiement',
  'En attente',
  'En préparation expédition',
  'Expédiée',
  'Facturée',
  'Livrée',
  'Annulée',
];

export default function AdminOrders({ orders = [], products = [], onUpdateOrderStatus }) {
  const [expanded, setExpanded] = useState(null);
  const [sortField, setSortField] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sorted = [...orders].sort((a, b) => {
    const va = a[sortField];
    const vb = b[sortField];
    if (typeof va === 'string') {
      return sortDir === 'asc' ? va.localeCompare(vb, 'fr') : vb.localeCompare(va, 'fr');
    }
    return sortDir === 'asc' ? va - vb : vb - va;
  });

  const sortIndicator = (field) => (sortField === field ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '');

  return (
    <article className="card stack">
      <h2>Gestion des commandes</h2>
      <span className="helper-text">{orders.length} commande(s)</span>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>
                <button type="button" className="btn btn--link" onClick={() => toggleSort('id')}>
                  N° Commande{sortIndicator('id')}
                </button>
              </th>
              <th>
                <button type="button" className="btn btn--link" onClick={() => toggleSort('createdAt')}>
                  Date{sortIndicator('createdAt')}
                </button>
              </th>
              <th>Produits</th>
              <th>
                <button type="button" className="btn btn--link" onClick={() => toggleSort('totalCents')}>
                  Total{sortIndicator('totalCents')}
                </button>
              </th>
              <th>Statut</th>
              <th>Détails</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((order) => (
              <React.Fragment key={order.id}>
                <tr>
                  <td><strong>{order.id}</strong></td>
                  <td>{order.createdAt}</td>
                  <td className="helper-text">
                    {order.items
                      .map((item) => products.find((p) => p.id === item.productId)?.name || item.productId)
                      .join(', ')}
                  </td>
                  <td><strong>{formatPrice(order.totalCents)}</strong></td>
                  <td>
                    <select
                      className="select"
                      style={{ width: 'auto', fontSize: '0.82rem', padding: '6px 8px' }}
                      value={order.status}
                      onChange={(e) => onUpdateOrderStatus(order.id, e.target.value)}
                      aria-label={`Statut de la commande ${order.id}`}
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
                {expanded === order.id ? (
                  <tr>
                    <td colSpan="6">
                      <div className="panel stack">
                        <h4>Détail — {order.id}</h4>
                        {order.items.map((item) => {
                          const product = products.find((p) => p.id === item.productId);
                          return (
                            <p key={item.productId}>
                              {product?.name || item.productId} × {item.quantity}
                            </p>
                          );
                        })}
                        <hr />
                        {order.billingAddress ? (
                          <p>Adresse : {order.billingAddress.address1}, {order.billingAddress.city}</p>
                        ) : null}
                        <p>Paiement : {order.paymentSummary}</p>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="notice notice--info">
        Backend hook : remboursement et génération de facture PDF nécessitent une API connectée.
      </div>
    </article>
  );
}
