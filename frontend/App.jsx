import React, { useEffect, useMemo, useState } from 'react';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import './styles/App.css';

import Home from './pages/Home/Home.jsx';
import Category from './pages/Category/Category.jsx';
import Product from './pages/Product/Product.jsx';
import Search from './pages/Search/Search.jsx';
import Cart from './pages/Cart/Cart.jsx';
import Checkout from './pages/Checkout/Checkout.jsx';
import Register from './pages/Register/Register.jsx';
import Login from './pages/Login/Login.jsx';
import Account from './pages/Account/Account.jsx';
import OrderHistory from './pages/OrderHistory/OrderHistory.jsx';
import Contact from './pages/Contact/Contact.jsx';
import Admin from './pages/Admin/Admin.jsx';

const routes = {
  '/': Home,
  '/category': Category,
  '/product': Product,
  '/search': Search,
  '/cart': Cart,
  '/checkout': Checkout,
  '/register': Register,
  '/login': Login,
  '/account': Account,
  '/orders': OrderHistory,
  '/contact': Contact,
  '/admin': Admin,
};

const navItems = [
  { label: 'Accueil', path: '/' },
  { label: 'Catalogue', path: '/category' },
  { label: 'Recherche', path: '/search' },
  { label: 'Panier', path: '/cart' },
  { label: 'Compte', path: '/account' },
  { label: 'Admin', path: '/admin' },
];

function getPathFromHash() {
  const hashPath = window.location.hash.replace('#', '').trim();
  return hashPath || '/';
}

export default function App() {
  const [currentPath, setCurrentPath] = useState(getPathFromHash());

  useEffect(() => {
    if (!window.location.hash) {
      window.location.hash = '/';
    }

    const onHashChange = () => setCurrentPath(getPathFromHash());
    window.addEventListener('hashchange', onHashChange);

    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const CurrentPage = useMemo(() => routes[currentPath] || Home, [currentPath]);

  return (
    <div className="app-shell">
      <Header navItems={navItems} />

      <main className="app-main">
        <CurrentPage />
      </main>

      <Footer />
    </div>
  );
}
