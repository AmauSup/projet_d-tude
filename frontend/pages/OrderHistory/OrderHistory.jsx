import React, { useState } from 'react';
import './OrderHistory.css';
import { formatPrice } from '../../utils/storefront.js';

export default function OrderHistory({ orders = [], products = [], onNavigate }) {
	const [expanded, setExpanded] = useState(null);

	return (
		<section className="page order-page">
			<header className="page__header">
				<h1 className="page__title">Historique des commandes</h1>
				<p className="page__subtitle">Consultez vos commandes d'équipements médicaux et leur statut.</p>
			</header>

			<div className="order-list">
				{orders.map((order) => (
					<article className="card order-item" key={order.id}>
						<div className="inline-actions" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
							<div>
								<h3 style={{ marginBottom: 4 }}>{order.id}</h3>
								<p className="helper-text">
									{new Date(order.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
								</p>
							</div>
							<div className="inline-actions">
								<span className="status-pill status-pill--warning">{order.status}</span>
								<strong>{formatPrice(order.totalCents)}</strong>
								<button
									type="button"
									className="btn btn--secondary"
									onClick={() => setExpanded(expanded === order.id ? null : order.id)}
									aria-expanded={expanded === order.id}
								>
									{expanded === order.id ? 'Fermer' : 'Voir le détail'}
								</button>
							</div>
						</div>

						{expanded === order.id ? (
							<div className="panel stack" style={{ marginTop: 16 }}>
								<h4>Produits commandés</h4>
								{order.items.map((item) => {
									const product = products.find((product) => product.id === item.productId);
									return (
										<div key={item.productId} className="inline-actions">
											<span>{product?.name || item.productId}</span>
											<span className="helper-text">× {item.quantity} — {product ? formatPrice(product.priceCents * item.quantity) : '–'}</span>
										</div>
									);
								})}
								<hr />
								<p><strong>Total : {formatPrice(order.totalCents)}</strong></p>
								{order.billingAddress ? (
									<>
										<h4>Adresse de facturation</h4>
										<p>{order.billingAddress.firstName} {order.billingAddress.lastName}</p>
										<p>{order.billingAddress.address1}, {order.billingAddress.city} {order.billingAddress.postalCode}</p>
									</>
								) : null}
								{order.paymentSummary ? (
									<>
										<h4>Paiement</h4>
										<p>{order.paymentSummary}</p>
									</>
								) : null}
							</div>
						) : null}
					</article>
				))}
				{orders.length === 0 ? (
					<div className="notice notice--info">Vous n'avez pas encore de commande.</div>
				) : null}
			</div>

			<div className="page-actions">
				<button className="btn btn--secondary" type="button" onClick={() => onNavigate('/account')}>Retour à mon compte</button>
			</div>
		</section>
	);
}
