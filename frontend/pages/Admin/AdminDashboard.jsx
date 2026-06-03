import React from 'react';

export default function AdminDashboard({ stats }) {
  const pendingOrders = 2;
  const outOfStockProducts = 3;
  const activeUsers = 12;

  return (
    <article className="card stack">
      <div className="inline-actions" style={{ justifyContent: 'space-between' }}>
        <div>
          <h2>Dashboard</h2>
          <p className="helper-text">
            Vue d’ensemble du back-office Althea Medical.
          </p>
        </div>
        <span className="status-pill status-pill--ok">Démo prête</span>
      </div>

      <div className="metric-grid">
        <div className="metric-card">
          <h3>Chiffre d’affaires</h3>
          <div className="metric-card__value">{stats.revenueFormatted}</div>
          <p className="helper-text">Total des commandes simulées</p>
        </div>

        <div className="metric-card">
          <h3>Commandes</h3>
          <div className="metric-card__value">{stats.orders}</div>
          <p className="helper-text">{pendingOrders} en attente de traitement</p>
        </div>

        <div className="metric-card">
          <h3>Produits</h3>
          <div className="metric-card__value">{stats.products}</div>
          <p className="helper-text">{outOfStockProducts} en rupture</p>
        </div>

        <div className="metric-card">
          <h3>Utilisateurs</h3>
          <div className="metric-card__value">{activeUsers}</div>
          <p className="helper-text">Comptes clients et administrateurs</p>
        </div>
      </div>

      <div className="admin-dashboard-grid">
        <section className="panel stack">
          <h3>Activité récente</h3>
          <div className="admin-activity">
            <p><strong>Commande #CMD-1024</strong> créée il y a 12 min</p>
            <p><strong>Produit prioritaire</strong> mis à jour</p>
            <p><strong>Utilisateur admin</strong> connecté au back-office</p>
          </div>
        </section>

        <section className="panel stack">
          <h3>Alertes de gestion</h3>
          <div className="admin-alert-list">
            <span className="status-pill status-pill--danger">
              {outOfStockProducts} produits en rupture
            </span>
            <span className="status-pill status-pill--warning">
              {pendingOrders} commandes à traiter
            </span>
            <span className="status-pill status-pill--ok">
              Interface synchronisée
            </span>
          </div>
        </section>
      </div>

      <section className="panel stack">
        <h3>Préparation démo</h3>
        <div className="admin-demo-grid">
          <div>
            <strong>Produits</strong>
            <p className="helper-text">Priorité, stock et mise en avant opérationnels.</p>
          </div>
          <div>
            <strong>Commandes</strong>
            <p className="helper-text">Statuts modifiables et détails consultables.</p>
          </div>
          <div>
            <strong>Utilisateurs</strong>
            <p className="helper-text">Création, recherche et désactivation prévues.</p>
          </div>
        </div>
      </section>
    </article>
  );
}