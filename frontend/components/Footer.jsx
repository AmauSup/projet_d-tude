import React from 'react';
import './Footer.css';

export default function Footer() {
	return (
		<footer className="site-footer">
			<div className="site-footer__container">
				© {new Date().getFullYear()} Althea Systems — Plateforme e-commerce d'équipements médicaux.
			</div>
		</footer>
	);
}
