import React from 'react';
import './Checkout.css';

export default function Checkout() {
	return (
		<section className="page checkout-page">
			<header className="page__header">
				<h1 className="page__title">Passage en caisse</h1>
				<p className="page__subtitle">Connexion/inscription, adresse de facturation, paiement sécurisé puis confirmation.</p>
			</header>

			<div className="checkout-steps">
				<span className="checkout-step is-active">1. Livraison</span>
				<span className="checkout-step">2. Paiement</span>
				<span className="checkout-step">3. Confirmation</span>
			</div>

			<div className="form-grid">
				<input className="input" placeholder="Prénom" />
				<input className="input" placeholder="Nom" />
				<input className="input" placeholder="Email" />
				<input className="input" placeholder="Adresse 1" />
				<input className="input" placeholder="Adresse 2 (optionnel)" />
				<input className="input" placeholder="Ville" />
				<input className="input" placeholder="Région" />
				<input className="input" placeholder="Code postal" />
				<input className="input" placeholder="Pays" />
				<input className="input" placeholder="Téléphone mobile" />
				<input className="input" placeholder="Nom sur la carte" />
				<input className="input" placeholder="Numéro de carte" />
				<input className="input" placeholder="Date d'expiration (MM/AA)" />
				<input className="input" placeholder="CVV" />
			</div>

			<div className="checkout-actions">
				<button type="button" className="btn btn--secondary">Retour panier</button>
				<button type="button" className="btn btn--primary">Continuer</button>
			</div>
		</section>
	);
}
