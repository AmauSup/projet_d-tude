import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import './Header.css';
import { useI18n } from '../contexts/I18nContext.jsx';
import { useTheme } from '../contexts/ThemeContext.jsx';

Header.propTypes = {
  // navItems : liens affichés dans la barre de navigation principale (desktop)
  navItems: PropTypes.arrayOf(
    PropTypes.shape({ path: PropTypes.string.isRequired, label: PropTypes.string.isRequired })
  ),
  currentPath: PropTypes.string,   // Chemin actif (ex: '/catalog') pour surligner le lien courant
  cartCount: PropTypes.number,     // Nombre d'articles dans le panier (affiché sur l'icône 🛒)
  searchValue: PropTypes.string,   // Valeur initiale du champ de recherche (synchronisée depuis App.jsx)
  isAuthenticated: PropTypes.bool, // true si l'utilisateur est connecté
  isAdmin: PropTypes.bool,         // true si l'utilisateur a le rôle admin (affiche le lien Admin)
  onNavigate: PropTypes.func.isRequired,    // Callback de navigation vers un chemin donné
  onSearchSubmit: PropTypes.func.isRequired, // Callback appelé lors de la soumission de la recherche
  onLogout: PropTypes.func,        // Callback de déconnexion
  showRegisterAction: PropTypes.bool, // Affiche ou non le bouton "S'inscrire" sur desktop
};

// Construit le label aria-label du bouton panier, lisible par les lecteurs d'écran.
// Paramètres :
//   count (number) — nombre d'articles dans le panier
// Retourne :
//   (string) — ex: "Panier vide", "Panier, 1 article", "Panier, 3 articles"
function buildCartLabel(count) {
  if (count === 0) return 'Panier vide';
  const suffix = count > 1 ? 's' : '';
  return `Panier, ${count} article${suffix}`;
}

// Composant d'en-tête du site — présent sur toutes les pages visiteur.
// Gère la barre de recherche, la navigation principale, le menu burger mobile,
// le sélecteur de langue, le toggle de thème et les actions d'authentification.
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
  const { locale, setLocale, t } = useI18n(); // t() pour les libellés traduits, setLocale pour changer la langue
  const { isDark, toggleTheme } = useTheme(); // isDark pour afficher ☀️/🌙, toggleTheme pour basculer

  const [query, setQuery] = useState(searchValue);     // Texte du champ de recherche (contrôlé)
  const [menuOpen, setMenuOpen] = useState(false);     // true = menu burger mobile visible
  const menuRef = useRef(null);                        // Référence au conteneur du header (détection clic externe)

  // Synchronise le champ de recherche si searchValue change depuis le parent (ex: navigation vers une page Search)
  useEffect(() => { setQuery(searchValue); }, [searchValue]);
  // Ferme le menu burger à chaque changement de page (navigation sans rechargement)
  useEffect(() => { setMenuOpen(false); }, [currentPath]);

  // Ferme le menu burger si l'utilisateur clique en dehors du header.
  // L'écouteur est ajouté uniquement quand le menu est ouvert (optimisation).
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

  // Soumet la recherche : empêche le rechargement de la page (preventDefault)
  // et transmet la requête nettoyée (trim) au parent.
  const handleSubmit = (event) => {
    event.preventDefault();
    onSearchSubmit(query.trim());
  };

  // Navigue vers un chemin en fermant d'abord le menu burger (UX mobile).
  // Paramètres :
  //   path (string) — chemin cible (ex: '/catalog', '/login')
  const go = (path) => {
    setMenuOpen(false);
    onNavigate(path);
  };

  // Liens affichés dans le menu burger pour les visiteurs non connectés
  const burgerItemsGuest = [
    { label: t('nav.login'), path: '/login' },
    { label: t('nav.register'), path: '/register' },
    { label: t('nav.terms'), path: '/terms' },
    { label: t('nav.legal'), path: '/legal' },
    { label: 'RGPD', path: '/rgpd' },
    { label: t('nav.contact'), path: '/contact' },
    { label: t('nav.about'), path: '/about' },
  ];

  // Liens affichés dans le menu burger pour les utilisateurs connectés
  const burgerItemsAuth = [
    { label: t('nav.settings'), path: '/account/settings' },
    { label: t('nav.orders'), path: '/orders' },
    { label: t('nav.terms'), path: '/terms' },
    { label: t('nav.legal'), path: '/legal' },
    { label: 'RGPD', path: '/rgpd' },
    { label: t('nav.contact'), path: '/contact' },
    { label: t('nav.about'), path: '/about' },
  ];

  // Sélectionne la liste burger selon l'état de connexion
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
              placeholder={t('nav.searchPlaceholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label={t('nav.search')}
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

            {/* Sélecteur de langue — appelle setLocale() qui recharge les traductions depuis l'API */}
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

            {/* Bouton thème : affiche ☀️ si sombre (pour repasser au clair), 🌙 sinon */}
            <button
              type="button"
              className="site-header__utility"
              aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
              onClick={toggleTheme}
            >
              {isDark ? '☀️' : '🌙'}
            </button>

            {/* Icône panier avec badge indiquant le nombre d'articles */}
            <button
              type="button"
              className="site-header__utility"
              aria-label={buildCartLabel(cartCount)}
              onClick={() => go('/cart')}
            >
              🛒
              {cartCount > 0 && <span className="site-header__badge">{cartCount}</span>}
            </button>

            {/* Boutons desktop uniquement (cachés sur mobile via CSS) */}
            <div className="site-header__desktop-actions">
              {isAuthenticated ? (
                <>
                  <button type="button" className="site-header__utility" onClick={() => go('/account')}>
                    {t('nav.account')}
                  </button>
                  <button type="button" className="site-header__utility" onClick={onLogout}>
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

            {/* Bouton burger — visible uniquement sur mobile */}
            <button
              type="button"
              className="site-header__burger"
              aria-label={menuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
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

        {/* Menu déroulant burger (mobile) — s'affiche sous le topbar quand menuOpen=true */}
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
                {t('nav.logout')}
              </button>
            )}
            {isAdmin && (
              <button
                type="button"
                className="burger-menu__item"
                onClick={() => go('/admin/dashboard')}
              >
                {t('nav.admin')}
              </button>
            )}
            {/* Réseaux sociaux dans le burger sur mobile (le footer n'est pas accessible sur petits écrans) */}
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
