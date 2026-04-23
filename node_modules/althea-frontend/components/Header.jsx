import React, { useEffect, useState } from 'react';
<<<<<<< HEAD
=======
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
>>>>>>> origin/main
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

<<<<<<< HEAD
	return (
		<header className="site-header">
			<div className="site-header__container">
				<button type="button" className="site-header__brand" onClick={() => onNavigate('/')}>
					{t('app.brand')}
				</button>

				<button
					type="button"
					className="site-header__burger"
					onClick={() => setMenuOpen((previous) => !previous)}
					aria-expanded={menuOpen}
					aria-controls="main-navigation"
				>
					☰
				</button>

				<form className="site-header__search" onSubmit={handleSubmit}>
					<input
						className="input"
						type="search"
						placeholder="Rechercher un produit, une catégorie ou une caractéristique"
						value={query}
						onChange={(event) => setQuery(event.target.value)}
					/>
					<button type="submit" className="btn btn--primary">{t('nav.search')}</button>
				</form>

				<nav id="main-navigation" className={`site-header__nav ${menuOpen ? 'is-open' : ''}`}>
					{navItems.map((item) => (
						<button
							key={item.path}
							type="button"
							className={`site-header__link ${currentPath === item.path ? 'is-active' : ''}`}
							onClick={() => onNavigate(item.path)}
						>
							{item.label}
						</button>
					))}

					<div className="site-header__menu-group" aria-label="Menu utilisateur">
						{userMenuItems.map((item) => (
							<button key={item.path} type="button" className="site-header__link" onClick={() => onNavigate(item.path)}>
								{item.label}
							</button>
						))}
						{isAuthenticated ? (
							<button type="button" className="site-header__link" onClick={onLogout}>
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

					<button type="button" className="site-header__utility" onClick={() => onNavigate('/cart')}>
						Panier
						{cartCount > 0 ? <span className="site-header__badge">{cartCount}</span> : null}
					</button>
					<button type="button" className="site-header__utility" onClick={() => onNavigate('/login')}>
						{t('nav.login')}
					</button>
					{showRegisterAction && (
						<button type="button" className="site-header__utility" onClick={() => onNavigate('/register')}>
							{t('nav.register')}
						</button>
					)}
					{isAdmin ? (
						<button type="button" className="site-header__utility" onClick={() => onNavigate('/admin/dashboard')}>
							{t('nav.admin')}
						</button>
					) : null}
				</div>
			</div>
		</header>
	);
}
=======
	       return (
		       <header className="site-header">
			       <div className="site-header__container">
				       <div className="site-header__zone site-header__zone--left">
					       <button type="button" className="site-header__brand" onClick={() => onNavigate('/')}> 
						       {t('app.brand')}
					       </button>
					       <form className="site-header__search" onSubmit={handleSubmit}>
						       <input
							       className="input"
							       type="search"
							       placeholder="Rechercher un produit, une catégorie ou une caractéristique"
							       value={query}
							       onChange={(event) => setQuery(event.target.value)}
						       />
						       <button type="submit" className="btn btn--primary">{t('nav.search')}</button>
					       </form>
				       </div>
				       {/* Zone centrale (navigation) */}
				       <div className="site-header__zone site-header__zone--center">
					       <nav id="main-navigation" className={`site-header__nav ${menuOpen ? 'is-open' : ''}`}> 
							       {navItems.map((item) => (
								       <button
									       key={item.path}
									       type="button"
									       className={`site-header__link ${currentPath === item.path ? 'is-active' : ''}`}
									       onClick={() => onNavigate(item.path)}
								       >
									       {item.label}
								       </button>
							       ))}
							       <button
								       type="button"
								       className="site-header__link"
								       onClick={() => onNavigate('/search')}
							       >
								       Produit
							       </button>
					       </nav>
				       </div>
				       {/* Zone droite (actions/utilitaires) */}
				       <div className="site-header__zone site-header__zone--right">
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
						       <button type="button" className="site-header__utility" onClick={() => onNavigate('/cart')}>
							       Panier
							       {cartCount > 0 ? <span className="site-header__badge">{cartCount}</span> : null}
						       </button>
						       <button type="button" className="site-header__utility" onClick={() => onNavigate('/login')}>
							       {t('nav.login')}
						       </button>
						       {showRegisterAction && (
							       <button type="button" className="site-header__utility" onClick={() => onNavigate('/register')}>
								       {t('nav.register')}
							       </button>
						       )}
						       {isAdmin ? (
							       <button type="button" className="site-header__utility" onClick={() => onNavigate('/admin/dashboard')}>
								       {t('nav.admin')}
							       </button>
						       ) : null}
						       {isAuthenticated ? (
							       <button type="button" className="site-header__link" onClick={onLogout}>
								       {t('nav.logout')}
							       </button>
						       ) : null}
					       </div>
				       </div>
			       </div>
		       </header>
	       );
	}
>>>>>>> origin/main
