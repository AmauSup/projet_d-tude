import React from 'react';
import './Checkout.css';

export default function Checkout() {
	return (
		<section className="page checkout-page">
			<header className="page__header">
				<h1 className="page__title">Checkout</h1>
				<p className="page__subtitle">Étapes de paiement: livraison, paiement, confirmation.</p>
			</header>

			<div className="checkout-steps">
				<span className="checkout-step is-active">1. Livraison</span>
				<span className="checkout-step">2. Paiement</span>
				<span className="checkout-step">3. Confirmation</span>
			</div>

			<div className="form-grid">
				<input className="input" placeholder="Nom complet" />
				<input className="input" placeholder="Email" />
				<input className="input" placeholder="Adresse" />
				<input className="input" placeholder="Ville" />
			</div>

			<div className="checkout-actions">
				<button type="button" className="btn btn--secondary">Retour panier</button>
				<button type="button" className="btn btn--primary">Continuer</button>
			</div>
		</section>
	);
}
