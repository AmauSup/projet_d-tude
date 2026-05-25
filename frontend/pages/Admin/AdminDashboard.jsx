import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService.js';
import { formatPrice } from '../../utils/storefront.js';

export default function AdminDashboard({ stats: localStats }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    adminService.getStats().then((s) => {
      if (mounted) { setStats(s); setLoading(false); }
    }).catch((e) => {
      if (mounted) { setError(e.message); setLoading(false); }
    });
    return () => { mounted = false; };
  }, []);

  const s = stats || localStats || {};
  const dailySales = stats?.dailySales || [];
  const categorySales = stats?.categorySales || [];
  const recentOrders = stats?.recentOrders || [];

  const maxRevenue = dailySales.length ? Math.max(...dailySales.map((d) => Number(d.revenue) || 0), 1) : 1;

  return (
    <article className="card stack">
      <h2>Dashboard analytiques</h2>

      {loading && <div className="notice notice--info">Chargement des statistiques…</div>}
      {error && <div className="notice notice--warning">Erreur : {error}</div>}

      <div className="metric-grid">
        <div className="metric-card">
          <h3>Chiffre d'affaires (30 j)</h3>
          <div className="metric-card__value">{formatPrice((s.revenue30d || s.revenue || 0) * 100)}</div>
        </div>
        <div className="metric-card">
          <h3>Commandes totales</h3>
          <div className="metric-card__value">{s.orders ?? localStats?.orders ?? '–'}</div>
        </div>
        <div className="metric-card">
          <h3>Produits actifs</h3>
          <div className="metric-card__value">{s.products ?? localStats?.products ?? '–'}</div>
        </div>
        <div className="metric-card">
          <h3>Utilisateurs</h3>
          <div className="metric-card__value">{s.users ?? '–'}</div>
        </div>
      </div>

      {dailySales.length > 0 && (
        <div className="panel stack">
          <h3>Ventes — 7 derniers jours</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 100 }}>
            {dailySales.map((day) => {
              const h = Math.max(4, Math.round((Number(day.revenue) / maxRevenue) * 90));
              return (
                <div key={day.day} title={`${day.day} — ${day.orders} commandes — ${formatPrice(Number(day.revenue) * 100)}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                  <div style={{ width: '100%', height: h, background: 'var(--color-primary, #1a6b5a)', borderRadius: 3 }} />
                  <span style={{ fontSize: '0.65rem', marginTop: 2 }}>{new Date(day.day).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {categorySales.length > 0 && (
        <div className="panel stack">
          <h3>Ventes par catégorie</h3>
          <table className="admin-table">
            <thead>
              <tr><th>Catégorie</th><th>Articles vendus</th><th>Chiffre d'affaires</th></tr>
            </thead>
            <tbody>
              {categorySales.map((c) => (
                <tr key={c.category}>
                  <td>{c.category}</td>
                  <td>{c.items_sold}</td>
                  <td>{formatPrice(Number(c.revenue) * 100)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {recentOrders.length > 0 && (
        <div className="panel stack">
          <h3>10 dernières commandes</h3>
          <table className="admin-table">
            <thead>
              <tr><th>#</th><th>Client</th><th>Montant</th><th>Statut</th><th>Date</th></tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => (
                <tr key={o.id}>
                  <td>{o.id}</td>
                  <td>{o.first_name} {o.last_name} <span className="helper-text">({o.email})</span></td>
                  <td>{formatPrice(Number(o.total_amount) * 100)}</td>
                  <td><span className="status-pill status-pill--warning">{o.status}</span></td>
                  <td className="helper-text">{new Date(o.created_at).toLocaleDateString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}
