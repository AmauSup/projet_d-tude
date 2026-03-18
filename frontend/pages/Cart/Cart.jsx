import React from 'react';
import './Cart.css';

export default function Cart() {
	return (
		<section className="page cart-page">
			<header className="page__header">
				<h1 className="page__title">Mon panier</h1>
				<p className="page__subtitle">Accessible invité ou connecté. Vérifiez quantités, disponibilité et total TTC.</p>
			</header>

			<div className="cart-layout">
				<div className="cart-list">
					{[
						{ name: 'Tensiomètre électronique', qty: 1, price: '89,99 €', total: '89,99 €', status: 'Disponible' },
						{ name: 'Spiromètre clinique', qty: 1, price: '749,00 €', total: '749,00 €', status: 'Indisponible' },
					].map((item) => (
						<article className="cart-item" key={item.name}>
							<div className="cart-item__img" />
							<div>
								<h3>{item.name}</h3>
								<p>Quantité : {item.qty} • Statut : {item.status}</p>
							</div>
							<strong>{item.total}</strong>
						</article>
					))}
				</div>

				<aside className="cart-summary">
					<h3>Total commande</h3>
					<p>Sous-total : 838,99 €</p>
					<p>Taxes : 167,80 €</p>
					<p>Promotion : -15,00 €</p>
					<hr />
					<p><strong>Total TTC : 991,79 €</strong></p>
					<button className="btn btn--primary" type="button">Passer à la caisse</button>
				</aside>
			</div>

			<div className="cart-login-hint">
				<strong>Conseil :</strong> Connectez-vous ou créez un compte pour sauvegarder votre panier avant paiement.
			</div>
			<div className="cart-login-hint">
				<strong>Info stock :</strong> Les produits indisponibles doivent être retirés ou remplacés avant de continuer.
			</div>
		</section>
	);
}
