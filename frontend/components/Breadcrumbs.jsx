import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Breadcrumbs.css';

const labels = {
  '': 'Accueil',
  catalog: 'Catalogue',
  category: 'Catégorie',
  product: 'Produit',
  search: 'Recherche',
  cart: 'Panier',
  checkout: 'Checkout',
  confirmation: 'Confirmation',
  login: 'Connexion',
  register: 'Inscription',
  forgot: 'Mot de passe oublié',
  account: 'Compte',
  settings: 'Paramètres',
  addresses: 'Adresses',
  payments: 'Paiements',
  orders: 'Commandes',
  contact: 'Contact',
  about: 'À propos',
  legal: 'Mentions légales',
  terms: 'CGU',
  admin: 'Admin',
  dashboard: 'Dashboard',
  products: 'Produits',
  categories: 'Catégories',
  support: 'Support',
};

export default function Breadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return null;
  }

  let currentPath = '';

  return (
    <nav className="breadcrumbs" aria-label="Fil d’ariane">
      <ol>
        <li>
          <Link to="/">Accueil</Link>
        </li>
        {segments.map((segment, index) => {
          currentPath += `/${segment}`;
          const isLast = index === segments.length - 1;
          const label = labels[segment] ?? segment;

          return (
            <li key={currentPath}>
              {isLast ? <span aria-current="page">{label}</span> : <Link to={currentPath}>{label}</Link>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
