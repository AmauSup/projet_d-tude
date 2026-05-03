
// Header du site : gère la navigation principale, la recherche, le panier, l'accès admin, etc.
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import './Header.css';
import { useI18n } from '../contexts/I18nContext.jsx';

// Définition des props attendues pour le composant Header
Header.propTypes = {
  navItems: PropTypes.arrayOf(
    PropTypes.shape({
      path: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ),
  currentPath: PropTypes.string,
  cartCount: PropTypes.number,
  searchValue: PropTypes.string,
  isAuthenticated: PropTypes.bool,
  isAdmin: PropTypes.bool, // true si l'utilisateur est admin
  userMenuItems: PropTypes.arrayOf(
    PropTypes.shape({
      path: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ),
  onNavigate: PropTypes.func.isRequired,
  onSearchSubmit: PropTypes.func.isRequired,
  onLogout: PropTypes.func,
  showRegisterAction: PropTypes.bool,
};

export default function Header({
	navItems = [],
	currentPath,
	cartCount = 0,
	searchValue = '',
	isAuthenticated = false,
	isAdmin = false,
	userMenuItems = [],
	userProfile = {},
	onNavigate,
	onSearchSubmit,
	onLogout,
	showRegisterAction = false,
}) {
	const { locale, setLocale, t } = useI18n();
	const [query, setQuery] = useState(searchValue);
	const [menuOpen, setMenuOpen] = useState(false);

	// Synchronise la valeur de recherche avec la prop
	useEffect(() => {
		setQuery(searchValue);
	}, [searchValue]);

	// Ferme le menu lors d'un changement de page
	useEffect(() => {
		setMenuOpen(false);
	}, [currentPath]);

	// Soumission du formulaire de recherche
	const handleSubmit = (event) => {
		event.preventDefault();
		onSearchSubmit(query.trim());
	};

	
	// DEBUG: Affiche l'état reçu
	// eslint-disable-next-line no-console
	console.log('[Header] isAuthenticated:', isAuthenticated, 'userProfile:', userProfile);

	// Rendu du header principal
	return (
		<header className="site-header">
			<div className="site-header__container">
				<div className="site-header__zone site-header__zone--left">
					<button type="button" className="site-header__brand" onClick={() => onNavigate('/')}> 
						<span className="site-header__brand-text">Althea Medical</span>
					</button>
				</div>
				<div className="site-header__zone site-header__zone--center">
					<form className="site-header__search" onSubmit={handleSubmit} style={{display:'flex',alignItems:'center',gap:8,minWidth:0}}>
						<input
							className="input"
							type="search"
							placeholder="Rechercher un produit"
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							style={{flex:1,minWidth:0}}
						/>
						<button type="submit" className="btn btn--primary site-header__search-btn">{t('nav.search')}</button>
					</form>
				</div>
				<nav id="main-navigation" className={`site-header__nav ${menuOpen ? 'is-open' : ''}`}> 
					<button
						type="button"
						className={`site-header__link site-header__link--nav ${currentPath === '/' ? 'is-active' : ''}`}
						onClick={() => onNavigate('/')}
					>
						Accueil
					</button>
					<button
						type="button"
						className={`site-header__link site-header__link--nav ${currentPath === '/search' ? 'is-active' : ''}`}
						onClick={() => onNavigate('/search')}
					>
						Produits
					</button>
					{navItems.filter(item => !['/', '/catalogue', '/search'].includes(item.path)).map((item) => (
						<button
							key={item.path}
							type="button"
							className={`site-header__link site-header__link--nav ${currentPath === item.path ? 'is-active' : ''}`}
							onClick={() => onNavigate(item.path)}
						>
							{item.label}
						</button>
					))}
				</nav>
				<div className="site-header__actions">
					<select
						className="select site-header__locale"
						aria-label="Choisir la langue"
						value={locale}
						onChange={(event) => setLocale(event.target.value)}
					>
						<option value="fr">FR</option>
						<option value="en">EN</option>
					</select>
					<button type="button" className="site-header__utility site-header__link--nav" onClick={() => onNavigate('/cart')}>
						Panier
						{cartCount > 0 ? <span className="site-header__badge">{cartCount}</span> : null}
					</button>
					{/* Affiche l'état de connexion/déconnexion et le profil */}
					{isAuthenticated ? (
						<>
							<span className="site-header__user-label" style={{marginRight:8,fontWeight:600}}>
								{userProfile.first_name || userProfile.last_name
									? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim()
									: userProfile.email || 'Mon compte'}
							</span>
							<button type="button" className="site-header__utility site-header__link--nav" onClick={onLogout} style={{fontWeight:700}}>
								Déconnexion
							</button>
							{isAdmin && (
								<button type="button" className="site-header__utility site-header__link--nav" onClick={() => onNavigate('/admin/dashboard')}>
									{t('nav.admin')}
								</button>
							)}
						</>
					) : (
						<>
							<button type="button" className="site-header__utility site-header__link--nav" onClick={() => onNavigate('/login')} style={{fontWeight:700}}>
								Connexion
							</button>
							{showRegisterAction && (
								<button type="button" className="site-header__utility site-header__link--nav" onClick={() => onNavigate('/register')} style={{fontWeight:700}}>
									Créer un compte
								</button>
							)}
						</>
					)}
				</div>
			</div>
		</header>
	);
}
