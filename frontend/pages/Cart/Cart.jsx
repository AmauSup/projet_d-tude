import React from 'react';
import PropTypes from 'prop-types';
import './Cart.css';
import { formatPrice } from '../../utils/storefront.js';
import { useI18n } from '../../contexts/I18nContext.jsx';
import ImageWithLoader from '../../components/common/ImageWithLoader.jsx';

Cart.propTypes = {
  items: PropTypes.array,
  summary: PropTypes.shape({
    subtotalCents: PropTypes.number,
    taxCents: PropTypes.number,
    promotionCents: PropTypes.number,
    totalCents: PropTypes.number,
    unavailableCount: PropTypes.number,
  }),
  isAuthenticated: PropTypes.bool,
  onUpdateQuantity: PropTypes.func.isRequired,
  onRemoveItem: PropTypes.func.isRequired,
  onNavigate: PropTypes.func.isRequired,
};

export default function Cart({ items = [], summary, isAuthenticated, onUpdateQuantity, onRemoveItem, onNavigate }) {
	const { t } = useI18n();

	return (
		<section className="page cart-page">
			<header className="page__header">
				<h1 className="page__title">{t('cart.title')}</h1>
				<p className="page__subtitle">{t('cart.subtitle')}</p>
			</header>

			<div className="cart-layout">
				<div className="cart-list">
					{items.map((item) => (
						<article className="cart-item" key={item.productId}>
							<ImageWithLoader className="cart-item__img" src={item.product.image} alt={item.product.name} />
							<div>
								<h3>{item.product.name}</h3>
								<p>{t('cart.unitPrice')} {formatPrice(item.product.priceCents)}</p>
								<p>
									{t('cart.status')} {item.isUnavailable ? t('cart.unavailable') : `${item.product.availableStock} ${t('cart.inStock')}`}{' '}• {t('cart.total')} {formatPrice(item.lineTotalCents)}
								</p>
								<div className="cart-item__actions">
									<input
										className="input cart-item__qty"
										type="number"
										min="0"
										value={item.quantity}
										onChange={(event) => onUpdateQuantity(item.productId, Number(event.target.value))}
									/>
									<button className="btn btn--secondary" type="button" onClick={() => onRemoveItem(item.productId)}>
										{t('cart.remove')}
									</button>
								</div>
							</div>
							<strong>{formatPrice(item.lineTotalCents)}</strong>
						</article>
					))}
					{items.length === 0 ? <div className="notice notice--warning">{t('cart.empty')}</div> : null}
				</div>

				<aside className="cart-summary">
					<h3>{t('cart.orderTotal')}</h3>
					<p>{t('cart.subtotal')} {formatPrice(summary.subtotalCents)}</p>
					<p>{t('cart.tax')} {formatPrice(summary.taxCents)}</p>
					<p>{t('cart.promo')} -{formatPrice(summary.promotionCents)}</p>
					<hr />
					<p><strong>{t('cart.totalTax')} {formatPrice(summary.totalCents)}</strong></p>
					<button className="btn btn--primary" type="button" disabled={items.length === 0 || summary.unavailableCount > 0} onClick={() => onNavigate('/checkout')}>
						{t('cart.checkout')}
					</button>
					<button className="btn btn--secondary" type="button" onClick={() => onNavigate('/catalog')}>
						{t('cart.continueShopping')}
					</button>
				</aside>
			</div>

			<div className="cart-login-hint">
				<strong>{t('cart.tip')}</strong>{' '}
				{isAuthenticated ? t('cart.accountHint') : t('cart.guestHint')}
			</div>
			{summary.unavailableCount > 0 ? (
				<div className="cart-login-hint">
					<strong>{t('cart.stockInfo')}</strong>{' '}
					{t('cart.stockHint')}
				</div>
			) : null}
		</section>
	);
}
