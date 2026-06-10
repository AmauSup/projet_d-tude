import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import './Header.css';
import { useI18n } from '../contexts/I18nContext.jsx';

Header.propTypes = {
  navItems: PropTypes.arrayOf(
    PropTypes.shape({ path: PropTypes.string.isRequired, label: PropTypes.string.isRequired })
  ),
  currentPath: PropTypes.string,
  cartCount: PropTypes.number,
  searchValue: PropTypes.string,
  isAuthenticated: PropTypes.bool,
  isAdmin: PropTypes.bool,
  onNavigate: PropTypes.func.isRequired,
  onSearchSubmit: PropTypes.func.isRequired,
  onLogout: PropTypes.func,
  showRegisterAction: PropTypes.bool,
};

function buildCartLabel(count) {
  if (count === 0) return 'Panier vide';
  const suffix = count > 1 ? 's' : '';
  return `Panier, ${count} article${suffix}`;
}

export default function Header({
  navItems = [],
  currentPath,
  cartCount = 0,
  searchValue = '',
  isAuthenticated = false,
  isAdmin = false,
  onNavigate,
  onSearchSubmit,
  onLogout,
  showRegisterAction = false,
}) {
  const { locale, setLocale, t } = useI18n();
  const [query, setQuery] = useState(searchValue);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => { setQuery(searchValue); }, [searchValue]);
  useEffect(() => { setMenuOpen(false); }, [currentPath]);

  // Fermer le menu si clic en dehors
  useEffect(() => {
    if (!menuOpen) return;
    function handleOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [menuOpen]);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSearchSubmit(query.trim());
  };

  const go = (path) => {
    setMenuOpen(false);
    onNavigate(path);
  };

  // Items du menu burger selon l'état d'authentification (spec)
  const burgerItemsGuest = [
    { label: 'Se connecter', path: '/login' },
    { label: "S'inscrire", path: '/register' },
    { label: 'CGU', path: '/terms' },
    { label: 'Mentions légales', path: '/legal' },
    { label: 'Contact', path: '/contact' },
    { label: 'À propos de Althea Systems', path: '/about' },
  ];

  const burgerItemsAuth = [
    { label: 'Mes paramètres', path: '/account/settings' },
    { label: 'Mes commandes', path: '/orders' },
    { label: 'CGU', path: '/terms' },
    { label: 'Mentions légales', path: '/legal' },
    { label: 'Contact', path: '/contact' },
    { label: 'À propos de Althea Systems', path: '/about' },
  ];

  const burgerItems = isAuthenticated ? burgerItemsAuth : burgerItemsGuest;

  return (
    <header className="site-header">
      <div className="site-header__container" ref={menuRef}>
        {/* Ligne 1 : logo + actions + burger */}
        <div className="site-header__topbar">
          <button type="button" className="site-header__brand" onClick={() => go('/')}>
            Althea Systems
          </button>

          <form className="site-header__search" onSubmit={handleSubmit}>
            <input
              className="input"
              type="search"
              placeholder="Rechercher un produit, une catégorie…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Recherche"
            />
            <button type="submit" className="btn btn--primary site-header__search-btn">
              {t('nav.search')}
            </button>
          </form>

          <div className="site-header__actions">
            <nav className="site-header__nav" aria-label="Navigation principale">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  type="button"
                  className={`site-header__link ${currentPath === item.path ? 'is-active' : ''}`}
                  onClick={() => go(item.path)}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <select
              className="select site-header__locale"
              aria-label="Choisir la langue"
              value={locale}
              onChange={(e) => setLocale(e.target.value)}
            >
              <option value="fr">FR</option>
              <option value="en">EN</option>
              <option value="ar">AR</option>
              <option value="he">HE</option>
            </select>

            <button
              type="button"
              className="site-header__utility"
              aria-label={buildCartLabel(cartCount)}
              onClick={() => go('/cart')}
            >
              🛒
              {cartCount > 0 && <span className="site-header__badge">{cartCount}</span>}
            </button>

            {/* Boutons desktop uniquement (cachés sur mobile) */}
            <div className="site-header__desktop-actions">
              {isAuthenticated ? (
                <>
                  <button type="button" className="site-header__utility" onClick={() => go('/account')}>
                    Mon compte
                  </button>
                  <button type="button" className="site-header__link" onClick={onLogout}>
                    {t('nav.logout')}
                  </button>
                </>
              ) : (
                <>
                  <button type="button" className="site-header__utility" onClick={() => go('/login')}>
                    {t('nav.login')}
                  </button>
                  {showRegisterAction && (
                    <button type="button" className="site-header__utility" onClick={() => go('/register')}>
                      {t('nav.register')}
                    </button>
                  )}
                </>
              )}
              {isAdmin && (
                <button type="button" className="site-header__utility" onClick={() => go('/admin/dashboard')}>
                  {t('nav.admin')}
                </button>
              )}
            </div>

            {/* Burger button (mobile) */}
            <button
              type="button"
              className="site-header__burger"
              aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={menuOpen}
              aria-controls="burger-menu"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span className={`burger-icon ${menuOpen ? 'is-open' : ''}`}>
                <span /><span /><span />
              </span>
            </button>
          </div>
        </div>

        {/* Burger menu (dropdown mobile) */}
        {menuOpen && (
          <nav
            id="burger-menu"
            className="site-header__burger-menu"
            aria-label="Menu burger"
          >
            {burgerItems.map((item) => (
              <button
                key={item.path}
                type="button"
                className="burger-menu__item"
                onClick={() => go(item.path)}
              >
                {item.label}
              </button>
            ))}
            {isAuthenticated && (
              <button
                type="button"
                className="burger-menu__item burger-menu__item--danger"
                onClick={() => { setMenuOpen(false); onLogout(); }}
              >
                Se déconnecter
              </button>
            )}
            {isAdmin && (
              <button
                type="button"
                className="burger-menu__item"
                onClick={() => go('/admin/dashboard')}
              >
                Administration
              </button>
            )}
            {/* Réseaux sociaux (contenu footer déplacé dans le burger sur mobile) */}
            <div className="burger-menu__socials">
              <a href="https://linkedin.com/company/althea-systems" target="_blank" rel="noopener noreferrer" className="burger-menu__social-link">LinkedIn</a>
              <a href="https://x.com/altheasystems" target="_blank" rel="noopener noreferrer" className="burger-menu__social-link">X / Twitter</a>
              <a href="https://facebook.com/altheasystems" target="_blank" rel="noopener noreferrer" className="burger-menu__social-link">Facebook</a>
              <a href="https://youtube.com/@altheasystems" target="_blank" rel="noopener noreferrer" className="burger-menu__social-link">YouTube</a>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
