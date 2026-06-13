import React from 'react';
import PropTypes from 'prop-types';
import './Footer.css';
import { useI18n } from '../contexts/I18nContext.jsx';

Footer.propTypes = {
  // onNavigate : callback de navigation transmis depuis App.jsx
  // Permet de naviguer sans recharger la page (SPA HashRouter)
  onNavigate: PropTypes.func.isRequired,
};

// Pied de page du site — présent sur toutes les pages visiteur.
// Affiche les liens légaux, les réseaux sociaux et le copyright.
// Paramètres :
//   onNavigate (function) — navigue vers le chemin donné sans rechargement
export default function Footer({ onNavigate }) {
  const { t } = useI18n(); // t() pour les libellés traduits (copyright, liens nav)

  return (
    <footer className="site-footer">
      <div className="site-footer__container">
        {/* Slogan / copyright traduit */}
        <div>
          <strong>Althea Systems</strong> — {t('footer.copyright')}
        </div>

        {/* Liens de navigation secondaires (pages légales, contact, etc.) */}
        <div className="site-footer__links">
          <button type="button" onClick={() => onNavigate('/contact')}>{t('nav.contact')}</button>
          <button type="button" onClick={() => onNavigate('/terms')}>{t('nav.terms')}</button>
          <button type="button" onClick={() => onNavigate('/legal')}>{t('nav.legal')}</button>
          <button type="button" onClick={() => onNavigate('/rgpd')}>RGPD</button>
          <button type="button" onClick={() => onNavigate('/about')}>{t('nav.about')}</button>
          <button type="button" onClick={() => onNavigate('/account')}>{t('nav.account')}</button>
          <button type="button" onClick={() => onNavigate('/admin/dashboard')}>{t('nav.admin')}</button>
        </div>

        {/* Liens réseaux sociaux — target="_blank" + rel="noopener noreferrer" pour la sécurité */}
        <div className="site-footer__links" aria-label="Réseaux sociaux">
          <a href="https://linkedin.com/company/althea-systems" target="_blank" rel="noopener noreferrer">LinkedIn</a>
          <a href="https://x.com/altheasystems" target="_blank" rel="noopener noreferrer">X</a>
          <a href="https://facebook.com/altheasystems" target="_blank" rel="noopener noreferrer">Facebook</a>
          <a href="https://youtube.com/@altheasystems" target="_blank" rel="noopener noreferrer">YouTube</a>
        </div>

        {/* Année calculée dynamiquement pour ne jamais être obsolète */}
        <div>© {new Date().getFullYear()} Althea Systems</div>
      </div>
    </footer>
  );
}
