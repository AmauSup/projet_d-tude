import React from 'react';
import PropTypes from 'prop-types';
import './Footer.css';
import { useI18n } from '../contexts/I18nContext.jsx';

Footer.propTypes = {
  onNavigate: PropTypes.func.isRequired,
};

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
					<a href="https://linkedin.com/company/althea-systems" target="_blank" rel="noopener noreferrer">LinkedIn</a>
					<a href="https://x.com/altheasystems" target="_blank" rel="noopener noreferrer">X</a>
					<a href="https://facebook.com/altheasystems" target="_blank" rel="noopener noreferrer">Facebook</a>
					<a href="https://youtube.com/@altheasystems" target="_blank" rel="noopener noreferrer">YouTube</a>
				</div>
				<div>© {new Date().getFullYear()} Althea Systems</div>
			</div>
		</footer>
	);
}
