import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService.js';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminService.getStats('30d')
      .then((s) => setStats(s))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <article className="card"><div className="notice notice--info">Chargement…</div></article>;
  if (error) return <article className="card"><div className="notice notice--warning">Erreur : {error}</div></article>;

  const outOfStock = stats?.outOfStockProducts ?? 0;
  const pending = (stats?.recentOrders || []).filter((o) => o.status === 'En préparation').length;

  return (
    <article className="card stack">
      <div className="inline-actions" style={{ justifyContent: 'space-between' }}>
        <div>
          <h2>Dashboard</h2>
          <p className="helper-text">Vue d'ensemble — 30 derniers jours.</p>
        </div>
        <span className="status-pill status-pill--ok">Connecté au backend</span>
      </div>

      <div className="metric-grid">
        <div className="metric-card">
          <h3>CA (30 j)</h3>
          <div className="metric-card__value">
            {stats?.revenue30d == null ? '—' : `${Number(stats.revenue30d).toFixed(2)} €`}
          </div>
          <p className="helper-text">Chiffre d'affaires réel</p>
        </div>

        <div className="metric-card">
          <h3>Commandes</h3>
          <div className="metric-card__value">{stats?.orders ?? '—'}</div>
          <p className="helper-text">{pending} en préparation</p>
        </div>

        <div className="metric-card">
          <h3>Produits actifs</h3>
          <div className="metric-card__value">{stats?.products ?? '—'}</div>
          <p className="helper-text">{outOfStock > 0 ? `${outOfStock} en rupture` : 'Tous disponibles'}</p>
        </div>

        <div className="metric-card">
          <h3>Utilisateurs</h3>
          <div className="metric-card__value">{stats?.users ?? '—'}</div>
          <p className="helper-text">Comptes enregistrés</p>
        </div>
      </div>

      <div className="admin-dashboard-grid">
        <section className="panel stack">
          <h3>Dernières commandes</h3>
          {(stats?.recentOrders || []).length === 0 ? (
            <p className="helper-text">Aucune commande récente.</p>
          ) : (
            <div className="admin-activity">
              {(stats.recentOrders || []).slice(0, 5).map((o) => (
                <p key={o.id}>
                  <strong>#{o.id}</strong> — {o.first_name ? `${o.first_name} ${o.last_name}` : o.email || '?'}{' '}
                  <span className="helper-text">({o.status}) {Number(o.total_amount).toFixed(2)} €</span>
                </p>
              ))}
            </div>
          )}
        </section>

        <section className="panel stack">
          <h3>Alertes de gestion</h3>
          <div className="admin-alert-list">
            {outOfStock > 0 ? (
              <span className="status-pill status-pill--danger">{outOfStock} produit(s) en rupture</span>
            ) : (
              <span className="status-pill status-pill--ok">Aucune rupture de stock</span>
            )}
            {pending > 0 ? (
              <span className="status-pill status-pill--warning">{pending} commande(s) à traiter</span>
            ) : (
              <span className="status-pill status-pill--ok">Toutes les commandes traitées</span>
            )}
            <span className="status-pill status-pill--ok">Backend PostgreSQL connecté</span>
          </div>
        </section>
      </div>
    </article>
  );
}
