import React from 'react';
import './Cart.css';

export default function Cart() {
	return (
		<section className="page cart-page">
			<header className="page__header">
				<h1 className="page__title">Mon panier</h1>
				<p className="page__subtitle">Vérifiez vos articles avant de passer à l'étape paiement.</p>
			</header>

			<div className="cart-layout">
				<div className="cart-list">
					{[1, 2].map((item) => (
						<article className="cart-item" key={item}>
							<div className="cart-item__img" />
							<div>
								<h3>Produit {item}</h3>
								<p>Quantité : 1</p>
							</div>
							<strong>89,99 €</strong>
						</article>
					))}
				</div>

				<aside className="cart-summary">
					<h3>Total commande</h3>
					<p>Sous-total : 179,98 €</p>
					<p>Taxes : 36,00 €</p>
					<p>Promotion : -10,00 €</p>
					<hr />
					<p><strong>Total TTC : 205,98 €</strong></p>
					<button className="btn btn--primary" type="button">Passer au checkout</button>
				</aside>
			</div>

			<div className="cart-login-hint">
				<strong>Conseil :</strong> Connectez-vous ou créez un compte pour sauvegarder votre panier.
			</div>
		</section>
	);
}
