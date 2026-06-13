import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Breadcrumbs.css';

// Table de correspondance segment URL → libellé affiché dans le fil d'ariane.
// Les segments non trouvés ici affichent le segment brut (ex: un slug de produit).
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

// Composant fil d'ariane — construit automatiquement depuis l'URL courante.
// Affiche une liste de liens cliquables menant à chaque niveau de l'arborescence.
// Le dernier segment est affiché en texte simple (non cliquable, page actuelle).
// Retourne null sur la page d'accueil (aucun segment à afficher).
export default function Breadcrumbs() {
  const location = useLocation(); // Fournit pathname courant (ex: "/admin/products")
  // Découpe le chemin en segments et retire les chaînes vides (slash de début/fin)
  const segments = location.pathname.split('/').filter(Boolean);

  // Pas de fil d'ariane sur la page d'accueil
  if (segments.length === 0) {
    return null;
  }

  // currentPath : construit le chemin cumulatif à chaque itération pour les liens
  // Ex: segments = ['admin', 'products'] → chemins '/admin' puis '/admin/products'
  let currentPath = '';

  return (
    <nav className="breadcrumbs" aria-label="Fil d'ariane">
      <ol>
        {/* Accueil est toujours le premier élément */}
        <li>
          <Link to="/">Accueil</Link>
        </li>
        {segments.map((segment, index) => {
          currentPath += `/${segment}`;
          const isLast = index === segments.length - 1; // Dernier segment = page actuelle

          // Cherche le libellé dans la table, sinon affiche le segment brut (slug, id...)
          const label = labels[segment] ?? segment;

          return (
            <li key={currentPath}>
              {/* Dernier segment : texte aria-current="page" (pas de lien cliquable) */}
              {isLast ? <span aria-current="page">{label}</span> : <Link to={currentPath}>{label}</Link>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
