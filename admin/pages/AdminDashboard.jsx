import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { adminService } from '../services/adminService.js';
import './AdminDashboard.css';

// PropTypes partagés entre BarChart et PieChart
const chartPropTypes = {
  data: PropTypes.arrayOf(PropTypes.object).isRequired, // Tableau de données à visualiser
  valueKey: PropTypes.string,   // Clé de l'objet contenant la valeur numérique à afficher
  labelKey: PropTypes.string,   // Clé de l'objet contenant le libellé de l'axe X / légende
  title: PropTypes.string,      // Titre affiché au-dessus du graphique
};

// Palette de bleus utilisée pour les barres et les secteurs des graphiques.
// Cycle automatique via `i % CHART_COLORS.length` si plus de 6 séries.
const CHART_COLORS = ['#0284c7', '#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd', '#e0f2fe'];

// Options de période disponibles dans le sélecteur du dashboard.
// value est envoyé au backend comme paramètre ?period=...
const PERIOD_OPTIONS = [
  { value: '7d', label: '7 derniers jours' },
  { value: '5w', label: '5 dernières semaines' },
  { value: '30d', label: '30 derniers jours' },
];

BarChart.propTypes = chartPropTypes;

// Graphique à barres verticales rendu en CSS pur (pas de dépendance externe).
// Les barres sont redimensionnées proportionnellement à la valeur maximale (max=100%).
// Paramètres :
//   data     (array)  — données à afficher (ex: [{ label: '06-01', revenue: 1200 }])
//   valueKey (string) — clé de la valeur numérique dans chaque objet (défaut: 'revenue')
//   labelKey (string) — clé du libellé sous la barre (défaut: 'label')
//   title    (string) — titre optionnel affiché au-dessus
function BarChart({ data, valueKey = 'revenue', labelKey = 'label', title }) {
  if (!data || data.length === 0) {
    return <p className="helper-text" style={{ textAlign: 'center', padding: 24 }}>Aucune donnée sur cette période.</p>;
  }
  const max = Math.max(...data.map((d) => Number(d[valueKey])), 1); // Max pour normaliser les hauteurs (min 1 pour éviter division par 0)
  const barWidth = Math.max(20, Math.min(48, Math.floor(360 / data.length) - 8)); // Largeur adaptée au nombre de barres

  return (
    <div className="chart-wrapper">
      {title && <h4 className="chart-title">{title}</h4>}
      <div className="bar-chart" role="img" aria-label={title}>
        {data.map((d, i) => {
          const val = Number(d[valueKey]);
          const pct = max > 0 ? (val / max) * 100 : 0; // Hauteur en % du max
          return (
            <div key={d[labelKey] ?? i} className="bar-col" style={{ width: barWidth }}>
              {/* Valeur en k si >= 1000, sinon entier */}
              <span className="bar-value">{val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toFixed(0)}</span>
              <div
                className="bar-fill"
                style={{ height: `${Math.max(pct, 2)}%`, background: CHART_COLORS[i % CHART_COLORS.length] }}
                title={`${d[labelKey]}: ${val}`}
              />
              <span className="bar-label">{d[labelKey]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

PieChart.propTypes = chartPropTypes;

// Graphique en secteurs (camembert) rendu en SVG.
// Calcule les arcs SVG manuellement à partir des angles proportionnels aux valeurs.
// Limité à 6 secteurs (max de CHART_COLORS) pour garder la lisibilité.
// Paramètres :
//   data     (array)  — données à afficher
//   valueKey (string) — clé de la valeur (défaut: 'revenue')
//   labelKey (string) — clé du libellé dans la légende (défaut: 'category')
//   title    (string) — titre optionnel
function PieChart({ data, valueKey = 'revenue', labelKey = 'category', title }) {
  if (!data || data.length === 0) {
    return <p className="helper-text" style={{ textAlign: 'center', padding: 24 }}>Aucune donnée.</p>;
  }

  const total = data.reduce((s, d) => s + Number(d[valueKey]), 0);
  if (total === 0) {
    return <p className="helper-text" style={{ textAlign: 'center', padding: 24 }}>Aucune vente enregistrée.</p>;
  }

  // Paramètres du cercle SVG (viewBox 0 0 160 160)
  const cx = 80, cy = 80, r = 70;
  let cumAngle = -Math.PI / 2; // Commence en haut (12h) plutôt qu'à droite (3h)

  // Construit chaque secteur : angle proportionnel à la valeur, path SVG arc
  const slices = data.slice(0, 6).map((d, i) => {
    const val = Number(d[valueKey]);
    const angle = (val / total) * 2 * Math.PI;    // Angle du secteur en radians
    const x1 = cx + r * Math.cos(cumAngle);        // Point de départ sur le cercle
    const y1 = cy + r * Math.sin(cumAngle);
    cumAngle += angle;
    const x2 = cx + r * Math.cos(cumAngle);        // Point de fin sur le cercle
    const y2 = cy + r * Math.sin(cumAngle);
    const large = angle > Math.PI ? 1 : 0;          // Flag SVG : arc > 180° = large-arc-flag=1
    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
    return { path, color: CHART_COLORS[i % CHART_COLORS.length], label: d[labelKey], pct: ((val / total) * 100).toFixed(1) };
  });

  return (
    <div className="chart-wrapper">
      {title && <h4 className="chart-title">{title}</h4>}
      <div className="pie-chart-layout" role="img" aria-label={title}>
        <svg viewBox="0 0 160 160" className="pie-svg">
          {slices.map((s) => (
            <path key={s.label} d={s.path} fill={s.color} stroke="#fff" strokeWidth="1.5">
              <title>{s.label} : {s.pct}%</title>
            </path>
          ))}
        </svg>
        <ul className="pie-legend">
          {slices.map((s) => (
            <li key={s.label} className="pie-legend__item">
              <span className="pie-legend__dot" style={{ background: s.color }} />
              <span>{s.label}</span>
              <strong>{s.pct}%</strong>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// Page Dashboard — vue d'ensemble des statistiques business.
// Charge les stats depuis l'API admin selon la période sélectionnée.
// Affiche des métriques clés, trois graphiques et les alertes de gestion.
export default function AdminDashboard() {
  const [stats, setStats] = useState(null);      // Objet stats complet renvoyé par le backend
  const [loading, setLoading] = useState(true);  // true pendant le chargement initial ou le changement de période
  const [error, setError] = useState('');        // Message d'erreur si l'API est indisponible
  const [period, setPeriod] = useState('7d');    // Période sélectionnée par l'admin (7d | 5w | 30d)

  // Recharge les stats à chaque changement de période
  useEffect(() => {
    setLoading(true);
    adminService.getStats(period)
      .then((s) => setStats(s))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) return <article className="card"><div className="notice notice--info">Chargement…</div></article>;
  if (error) return <article className="card"><div className="notice notice--warning">Erreur : {error}</div></article>;

  // Nombre de produits en rupture de stock (alertes de gestion)
  const outOfStock = stats?.outOfStockProducts ?? 0;
  // Commandes "En préparation" parmi les 10 dernières (indicateur urgence)
  const pending = (stats?.recentOrders || []).filter((o) => o.status === 'En préparation').length;

  return (
    <article className="card stack">
      <div className="inline-actions" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2>Dashboard</h2>
          <p className="helper-text">Vue d'ensemble de l'activité.</p>
        </div>
        <div className="inline-actions">
          <label htmlFor="dash-period" className="form-label" style={{ marginBottom: 0 }}>Période :</label>
          <select
            id="dash-period"
            className="select"
            style={{ width: 'auto' }}
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            {PERIOD_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <span className="status-pill status-pill--ok">Connecté au backend</span>
        </div>
      </div>

      {/* Cartes de métriques clés */}
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

      {/* Graphiques générés depuis les stats de la période sélectionnée */}
      <div className="dashboard-charts">
        <section className="panel">
          <BarChart data={stats?.dailySales || []} valueKey="revenue" labelKey="label" title="Chiffre d'affaires par période" />
        </section>
        <section className="panel">
          <BarChart data={stats?.avgBasketByCategory || []} valueKey="avg_unit_price" labelKey="category" title="Prix moyen par catégorie" />
        </section>
        <section className="panel">
          <PieChart data={stats?.categorySales || []} valueKey="revenue" labelKey="category" title="Répartition des ventes par catégorie" />
        </section>
      </div>

      {/* Alertes de gestion + dernières commandes */}
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
