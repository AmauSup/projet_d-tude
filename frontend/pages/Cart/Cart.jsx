import React from 'react';
import PropTypes from 'prop-types';
import './Cart.css';
import { formatPrice } from '../../utils/storefront.js';

export default function Cart({ items = [], summary, isAuthenticated, onUpdateQuantity, onRemoveItem, onNavigate }) {
	const plural = items.length === 1 ? '' : 's';
	const subtitleText = items.length === 0 ? 'Votre panier est vide.' : `${items.length} article${plural}`;

	return (
		<section className="page cart-page">
			<header className="page__header">
				<h1 className="page__title">Mon panier</h1>
				<p className="page__subtitle">{subtitleText}</p>
			</header>

			<div className="cart-layout">
				<div className="cart-list">
					{items.map((item) => (
						<article className={`cart-item ${item.isUnavailable ? 'cart-item--unavailable' : ''}`} key={item.productId}>
							{item.product.images?.[0] ? (
								<img src={item.product.images[0]} alt={item.product.name} className="cart-item__img" style={{ objectFit: 'cover' }} />
							) : (
								<div className="cart-item__img" aria-hidden="true" />
							)}
							<div className="cart-item__body">
								<h3>{item.product.name}</h3>
								<p>Prix unitaire : {formatPrice(item.product.priceCents)}</p>
								{item.isUnavailable ? (
									<p className="helper-text--error">Ce produit est indisponible et doit être retiré du panier.</p>
								) : (
									<p>{item.product.availableStock} en stock</p>
								)}
								<div className="cart-item__actions">
									<label htmlFor={`qty-${item.productId}`} className="form-label" style={{ margin: 0 }}>Qté</label>
									<input
										id={`qty-${item.productId}`}
										className="input cart-item__qty"
										type="number"
										min="1"
										max={item.product.availableStock > 0 ? item.product.availableStock : 1}
										value={item.quantity}
										onChange={(event) => onUpdateQuantity(item.productId, Number(event.target.value))}
										disabled={item.isUnavailable}
									/>
									<button className="btn btn--secondary" type="button" onClick={() => onRemoveItem(item.productId)}>
										Supprimer
									</button>
								</div>
							</div>
							<strong className="cart-item__total">{formatPrice(item.lineTotalCents)}</strong>
						</article>
					))}
					{items.length === 0 && (
						<div className="notice notice--warning">Votre panier est vide.</div>
					)}
				</div>

				<aside className="cart-summary">
					<h3>Total commande</h3>
					<p>Sous-total : {formatPrice(summary.subtotalCents)}</p>
					<p>Taxes : {formatPrice(summary.taxCents)}</p>
					<p>Promotion : -{formatPrice(summary.promotionCents)}</p>
					<hr />
					<p><strong>Total TTC : {formatPrice(summary.totalCents)}</strong></p>
					{summary.unavailableCount > 0 && (
						<div className="notice notice--warning" style={{ marginBottom: 12 }}>
							{summary.unavailableCount} produit{summary.unavailableCount === 1 ? '' : 's'} indisponible{summary.unavailableCount === 1 ? '' : 's'} — retirez-les pour continuer.
						</div>
					)}
					<button
						className="btn btn--primary"
						type="button"
						disabled={items.length === 0 || summary.unavailableCount > 0}
						onClick={() => onNavigate('/checkout')}
					>
						Passer à la caisse
					</button>
					<button className="btn btn--secondary" type="button" onClick={() => onNavigate('/catalog')}>
						Continuer mes achats
					</button>
				</aside>
			</div>

			<div className="cart-login-hint">
				<strong>Conseil :</strong>{' '}
				{isAuthenticated
					? 'Votre panier est rattaché à votre compte.'
					: 'Connectez-vous ou créez un compte pour sauvegarder votre panier avant paiement.'}
			</div>
		</section>
	);
}

Cart.propTypes = {
	items: PropTypes.arrayOf(PropTypes.shape({
		productId: PropTypes.number,
		quantity: PropTypes.number,
		lineTotalCents: PropTypes.number,
		isUnavailable: PropTypes.bool,
		product: PropTypes.shape({
			name: PropTypes.string,
			priceCents: PropTypes.number,
			availableStock: PropTypes.number,
			images: PropTypes.array,
		}),
	})),
	summary: PropTypes.shape({
		subtotalCents: PropTypes.number,
		taxCents: PropTypes.number,
		promotionCents: PropTypes.number,
		totalCents: PropTypes.number,
		unavailableCount: PropTypes.number,
	}).isRequired,
	isAuthenticated: PropTypes.bool,
	onUpdateQuantity: PropTypes.func.isRequired,
	onRemoveItem: PropTypes.func.isRequired,
	onNavigate: PropTypes.func.isRequired,
};
