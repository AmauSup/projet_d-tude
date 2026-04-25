import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/products', label: 'Produits', icon: '📦' },
  { to: '/categories', label: 'Catégories', icon: '🗂️' },
  { to: '/orders', label: 'Commandes', icon: '🧾' },
  { to: '/users', label: 'Utilisateurs', icon: '👤' },
  { to: '/support', label: 'Support', icon: '💬' },
  { to: '/homepage', label: 'Homepage', icon: '🏠' },
  { to: '/payments', label: 'Paiements', icon: '💳' },
  { to: '/settings', label: 'Paramètres', icon: '⚙️' },
];

export default function Sidebar() {
  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar__brand">Althea Admin</div>
      <nav className="admin-sidebar__nav">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              'admin-sidebar__link' + (isActive ? ' is-active' : '')
            }
          >
            <span className="admin-sidebar__icon">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
