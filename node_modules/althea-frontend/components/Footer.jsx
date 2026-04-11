import React from 'react';
import './Footer.css';
import { useI18n } from '../contexts/I18nContext.jsx';

export default function Footer({ onNavigate }) {
	const { t } = useI18n();

	return (
		<footer className="site-footer">
			<div className="site-footer__container">
				<div>
					<strong>Althea Systems</strong> — {t('footer.copyright')}
				</div>
				<div className="site-footer__links">
					<button type="button" onClick={() => onNavigate('/contact')}>Contact</button>
					<button type="button" onClick={() => onNavigate('/terms')}>CGU</button>
					<button type="button" onClick={() => onNavigate('/legal')}>Mentions légales</button>
					<button type="button" onClick={() => onNavigate('/about')}>À propos</button>
					<button type="button" onClick={() => onNavigate('/account')}>Mon compte</button>
					<button type="button" onClick={() => onNavigate('/admin/dashboard')}>Back-office</button>
				</div>
				<div className="site-footer__links" aria-label="Réseaux sociaux">
					<button type="button">LinkedIn</button>
					<button type="button">X</button>
					<button type="button">YouTube</button>
				</div>
				<div>© {new Date().getFullYear()} Althea Systems</div>
			</div>
		</footer>
	);
}
