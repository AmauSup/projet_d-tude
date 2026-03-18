import React from 'react';
import './OrderHistory.css';

export default function OrderHistory() {
	return (
		<section className="page order-page">
			<header className="page__header">
				<h1 className="page__title">Historique des commandes</h1>
				<p className="page__subtitle">Consultez vos commandes précédentes.</p>
			</header>

			<div className="order-list">
				{[1012, 1011, 1008].map((id) => (
					<article className="card order-item" key={id}>
						<h3>Commande #{id}</h3>
						<p>Date: 18/03/2026</p>
						<p>Statut: En préparation</p>
						<strong>Total: 259,90 €</strong>
					</article>
				))}
			</div>
		</section>
	);
}
