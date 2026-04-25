import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import './Breadcrumbs.css';

export default function Breadcrumbs() {
  const location = useLocation();
  const parts = location.pathname.split('/').filter(Boolean);
  let path = '';
  return (
    <nav className="admin-breadcrumbs" aria-label="Fil d'Ariane">
      <Link to="/dashboard">Dashboard</Link>
      {parts.map((part, i) => {
        path += '/' + part;
        return (
          <span key={i}>
            {' / '}
            <Link to={path}>{part.charAt(0).toUpperCase() + part.slice(1)}</Link>
          </span>
        );
      })}
    </nav>
  );
}
