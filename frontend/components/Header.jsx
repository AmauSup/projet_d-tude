import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
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
	isAdmin: PropTypes.bool,
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
import './Header.css';
import { useI18n } from '../contexts/I18nContext.jsx';

export default function Header({
	navItems = [],
	currentPath,
	cartCount = 0,
	searchValue = '',
	isAuthenticated = false,
	isAdmin = false,
	userMenuItems = [],
	onNavigate,
	onSearchSubmit,
	onLogout,
	showRegisterAction = false,
}) {
	const { locale, setLocale, t } = useI18n();
	const [query, setQuery] = useState(searchValue);
	const [menuOpen, setMenuOpen] = useState(false);

	useEffect(() => {
		setQuery(searchValue);
	}, [searchValue]);

	useEffect(() => {
		setMenuOpen(false);
	}, [currentPath]);

	const handleSubmit = (event) => {
			event.preventDefault();
			onSearchSubmit(query.trim());
		};

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
						<div className="site-header__menu-group" aria-label="Menu utilisateur">
							{userMenuItems.map((item) => (
								<button key={item.path} type="button" className="site-header__link site-header__link--nav" onClick={() => onNavigate(item.path)}>
									{item.label}
								</button>
							))}
							{isAuthenticated ? (
								<button type="button" className="site-header__link site-header__link--nav" onClick={onLogout}>
									{t('nav.logout')}
								</button>
							) : null}
						</div>
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
						<button type="button" className="site-header__utility site-header__link--nav" onClick={() => onNavigate('/login')}>
							{t('nav.login')}
						</button>
						{showRegisterAction && (
							<button type="button" className="site-header__utility site-header__link--nav" onClick={() => onNavigate('/register')}>
								{t('nav.register')}
							</button>
						)}
						{isAdmin ? (
							<button type="button" className="site-header__utility site-header__link--nav" onClick={() => onNavigate('/admin/dashboard')}>
								{t('nav.admin')}
							</button>
						) : null}
					</div>
				</div>
			</header>
		);
	}

