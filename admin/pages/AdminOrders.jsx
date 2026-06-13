import React, { useEffect, useState } from 'react';
import { adminService } from '../services/adminService.js';

// Statuts de commande valides (identiques à ceux définis dans admin/routes.js).
// Utilisés pour alimenter le <select> de changement de statut.
const STATUS_OPTIONS = ['En préparation', 'Confirmée', 'Expédiée', 'Livrée', 'Annulée'];

// Association statut → classe CSS pour la pastille colorée dans le détail d'une commande.
const STATUS_CLASS = {
  'En préparation': 'status-pill--warning',
  'Confirmée': 'status-pill--info',
  'Expédiée': 'status-pill--ok',
  'Livrée': 'status-pill--ok',
  'Annulée': 'status-pill--danger',
};

// Page de gestion des commandes — affiche la liste de toutes les commandes,
// permet de changer leur statut directement depuis le tableau,
// et d'afficher le détail d'une commande (adresse, paiement) en ligne.
export default function AdminOrders() {
  const [orders, setOrders] = useState([]);          // Tableau de toutes les commandes
  const [loading, setLoading] = useState(true);      // true pendant le chargement initial
  const [error, setError] = useState('');            // Message d'erreur API
  const [expanded, setExpanded] = useState(null);    // id de la commande dont le détail est visible
  const [updatingId, setUpdatingId] = useState(null); // id de la commande en cours de mise à jour (désactive le select)
  const [sortField, setSortField] = useState('created_at'); // Colonne de tri actuelle
  const [sortDir, setSortDir] = useState('desc');     // Direction du tri ('asc' ou 'desc')

  // Charge la liste des commandes au montage du composant
  useEffect(() => {
    adminService.listOrders()
      .then((o) => setOrders(o))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Bascule le tri sur un champ : si c'est déjà le champ actif, inverse la direction.
  // Sinon, définit le nouveau champ et repart en 'asc'.
  // Paramètres :
  //   field (string) — colonne sur laquelle trier (ex: 'created_at', 'total_amount')
  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  // Tri local des commandes sans appel API.
  // Gère les types string (localeCompare) et number (soustraction) automatiquement.
  const sorted = [...orders].sort((a, b) => {
    const va = a[sortField] ?? '';
    const vb = b[sortField] ?? '';
    if (typeof va === 'string') {
      return sortDir === 'asc' ? va.localeCompare(vb, 'fr') : vb.localeCompare(va, 'fr');
    }
    return sortDir === 'asc' ? Number(va) - Number(vb) : Number(vb) - Number(va);
  });

  // Retourne le symbole de direction (▲/▼) si ce champ est le champ de tri actif.
  // Paramètres :
  //   field (string) — champ à tester
  // Retourne :
  //   (string) — ' ▲', ' ▼' ou '' (chaîne vide si champ inactif)
  const sortIndicator = (field) => {
    if (sortField !== field) return '';
    return sortDir === 'asc' ? ' ▲' : ' ▼';
  };

  // Met à jour le statut d'une commande via l'API puis met à jour l'état local.
  // updatingId désactive le select pendant la requête pour éviter les doubles envois.
  // Paramètres :
  //   orderId   (number) — identifiant de la commande
  //   newStatus (string) — nouveau statut (doit être dans STATUS_OPTIONS)
  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      await adminService.updateOrderStatus(orderId, newStatus);
      // Mise à jour optimiste : modifie uniquement la commande concernée dans le state
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
              <th><button type="button" className="btn btn--link" onClick={() => toggleSort('id')}>N°{sortIndicator('id')}</button></th>
              <th><button type="button" className="btn btn--link" onClick={() => toggleSort('first_name')}>Client{sortIndicator('first_name')}</button></th>
              <th><button type="button" className="btn btn--link" onClick={() => toggleSort('created_at')}>Date{sortIndicator('created_at')}</button></th>
              <th><button type="button" className="btn btn--link" onClick={() => toggleSort('total_amount')}>Total{sortIndicator('total_amount')}</button></th>
              <th><button type="button" className="btn btn--link" onClick={() => toggleSort('status')}>Statut{sortIndicator('status')}</button></th>
              <th>Détails</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr><td colSpan="6" style={{ textAlign: 'center' }}><span className="helper-text">Aucune commande.</span></td></tr>
            )}
            {sorted.map((order) => (
              <React.Fragment key={order.id}>
                <tr>
                  <td><strong>#{order.id}</strong></td>
                  <td>{order.first_name ? `${order.first_name} ${order.last_name}` : order.email || '—'}</td>
                  <td className="helper-text">{order.created_at ? String(order.created_at).slice(0, 10) : '—'}</td>
                  <td><strong>{Number(order.total_amount).toFixed(2)} €</strong></td>
                  <td>
                    {/* Le select est désactivé pendant la mise à jour (updatingId) pour éviter les conflits */}
                    <select
                      className="select"
                      style={{ width: 'auto', fontSize: '0.82rem', padding: '6px 8px' }}
                      value={order.status}
                      disabled={updatingId === order.id}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      aria-label={`Statut commande ${order.id}`}
                    >
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td>
                    {/* Bascule l'affichage du détail pour cette commande */}
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
                {/* Ligne de détail (collapse) — visible uniquement si expanded === order.id */}
                {expanded === order.id && (
                  <tr>
                    <td colSpan="6">
                      <div className="panel stack">
                        <div className="inline-actions" style={{ justifyContent: 'space-between' }}>
                          <h4>Commande #{order.id}</h4>
                          <span className={`status-pill ${STATUS_CLASS[order.status] || ''}`}>{order.status}</span>
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
