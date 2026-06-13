import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

// Liens de navigation du back-office admin, dans l'ordre d'affichage.
// Chaque entrée correspond à une route déclarée dans App.jsx sous le layout admin.
const links = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/products', label: 'Produits' },
  { to: '/admin/categories', label: 'Catégories' },
  { to: '/admin/orders', label: 'Commandes' },
  { to: '/admin/content/home', label: 'Contenu accueil' },
  { to: '/admin/users', label: 'Utilisateurs' },
  { to: '/admin/support', label: 'Support' },
];

// Composant de mise en page du back-office admin.
// Rendu comme layout parent dans React Router : les routes enfants (/admin/*)
// s'affichent à l'endroit du <Outlet /> sans recharger le nav et l'en-tête.
// NavLink applique automatiquement la classe CSS quand la route est active (isActive).
export default function AdminLayout() {
  return (
    <section className="page admin-page">
      <header className="page__header">
        <h1 className="page__title">Back-office admin</h1>
        <p className="page__subtitle">Base frontend admin prête pour brancher le backend.</p>
      </header>

      {/* Barre de navigation horizontale entre les sections du back-office */}
      <nav className="admin-nav" aria-label="Navigation admin">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            // isActive fourni par React Router : true quand l'URL correspond exactement à `to`
            className={({ isActive }) => `btn btn--secondary ${isActive ? 'is-active' : ''}`}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      {/* Zone de contenu de la page enfant active (Dashboard, Produits, etc.) */}
      <div className="admin-content">
        <Outlet />
      </div>
    </section>
  );
}
