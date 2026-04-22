import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const links = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/products', label: 'Produits' },
  { to: '/admin/categories', label: 'Catégories' },
  { to: '/admin/orders', label: 'Commandes' },
  { to: '/admin/content/home', label: 'Contenu accueil' },
  { to: '/admin/support', label: 'Support' },
];

export default function AdminLayout() {
  return (
    <section className="page admin-page">
      <header className="page__header">
        <h1 className="page__title">Back-office admin</h1>
        <p className="page__subtitle">Base frontend admin prête pour brancher le backend.</p>
      </header>

      <div className="admin-sections">
        <nav className="inline-actions" aria-label="Navigation admin">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `btn btn--secondary ${isActive ? 'is-active' : ''}`}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <Outlet />
      </div>
    </section>
  );
}
