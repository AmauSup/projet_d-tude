import React from 'react';

export default function AdminDashboard({ stats }) {
  return (
    <article className="card stack">
      <h2>Dashboard</h2>
      <div className="metric-grid">
        <div className="metric-card">
          <h3>Ventes</h3>
          <div className="metric-card__value">{stats.revenueFormatted}</div>
        </div>
        <div className="metric-card">
          <h3>Commandes</h3>
          <div className="metric-card__value">{stats.orders}</div>
        </div>
        <div className="metric-card">
          <h3>Produits</h3>
          <div className="metric-card__value">{stats.products}</div>
        </div>
      </div>
      <div className="panel">Placeholder histogramme ventes (TODO backend analytics).</div>
      <div className="panel">Placeholder camembert catégories (TODO backend analytics).</div>
    </article>
  );
}
