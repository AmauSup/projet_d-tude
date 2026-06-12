import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import './OrderHistory.css';
import { formatPrice } from '../../utils/storefront.js';
import { useI18n } from '../../contexts/I18nContext.jsx';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

OrderHistory.propTypes = {
  orders: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    createdAt: PropTypes.string,
    status: PropTypes.string,
    totalCents: PropTypes.number,
    items: PropTypes.arrayOf(PropTypes.shape({
      productId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      quantity: PropTypes.number,
    })),
    billingAddress: PropTypes.object,
    paymentSummary: PropTypes.string,
  })),
  products: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    priceCents: PropTypes.number,
  })),
  onNavigate: PropTypes.func.isRequired,
  onAddToCart: PropTypes.func,
};

export default function OrderHistory({ orders = [], products = [], onNavigate, onAddToCart }) {
	const { t } = useI18n();
	const [expanded, setExpanded] = useState(null);
	const [search, setSearch] = useState('');
	const [yearFilter, setYearFilter] = useState('all');
	const [statusFilter, setStatusFilter] = useState('all');
	const [invoiceError, setInvoiceError] = useState('');
	const [invoiceLoading, setInvoiceLoading] = useState('');

	const downloadInvoice = async (orderId) => {
		setInvoiceLoading(orderId);
		setInvoiceError('');
		try {
			const token = localStorage.getItem('althea-auth-token') || sessionStorage.getItem('althea-auth-token') || '';
			const res = await fetch(`${API_BASE}/pg/orders/${orderId}/invoice`, {
				headers: token ? { Authorization: `Bearer ${token}` } : {},
			});
			if (!res.ok) {
				let msg = 'Erreur lors du téléchargement.';
				try { const data = await res.json(); msg = data.message || msg; } catch { /* ignore */ }
				setInvoiceError(msg);
				return;
			}
			const blob = await res.blob();
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `facture-${orderId}.pdf`;
			a.click();
			URL.revokeObjectURL(url);
		} catch (e) {
			setInvoiceError(e.message || 'Erreur réseau.');
		} finally {
			setInvoiceLoading('');
		}
	};

	const years = useMemo(() => {
		const set = new Set(orders.map((o) => (o.createdAt ? o.createdAt.slice(0, 4) : null)).filter(Boolean));
		return [...set].sort((a, b) => b - a);
	}, [orders]);

	const filtered = useMemo(() => {
		const q = search.toLowerCase().trim();
		return orders.filter((order) => {
			if (yearFilter !== 'all' && order.createdAt?.slice(0, 4) !== yearFilter) return false;
			if (statusFilter === 'active' && order.status === 'Annulée') return false;
			if (statusFilter === 'cancelled' && order.status !== 'Annulée') return false;
			if (statusFilter === 'delivered' && order.status !== 'Livrée') return false;
			if (!q) return true;
			if (order.id.toLowerCase().includes(q)) return true;
			return order.items.some((item) => {
				const product = products.find((p) => p.id === item.productId);
				return product?.name?.toLowerCase().includes(q);
			});
		});
	}, [orders, products, search, yearFilter, statusFilter]);

	const byYear = useMemo(() => {
		const map = new Map();
		for (const order of filtered) {
			const year = order.createdAt?.slice(0, 4) || 'Inconnue';
			if (!map.has(year)) map.set(year, []);
			map.get(year).push(order);
		}
		return [...map.entries()].sort(([a], [b]) => b - a);
	}, [filtered]);

	return (
		<section className="page order-page">
			<header className="page__header">
				<h1 className="page__title">{t('orders.title')}</h1>
				<p className="page__subtitle">{t('orders.subtitle')}</p>
			</header>

			<div className="inline-actions" style={{ marginBottom: 16 }}>
				<input
					className="input"
					style={{ flex: 1 }}
					type="search"
					placeholder={t('orders.searchPlaceholder')}
					value={search}
					onChange={(e) => setSearch(e.target.value)}
				/>
				<select
					className="select"
					style={{ width: 'auto' }}
					value={yearFilter}
					onChange={(e) => setYearFilter(e.target.value)}
					aria-label={t('orders.allYears')}
				>
					<option value="all">{t('orders.allYears')}</option>
					{years.map((y) => (
						<option key={y} value={y}>{y}</option>
					))}
				</select>
				<select
					className="select"
					style={{ width: 'auto' }}
					value={statusFilter}
					onChange={(e) => setStatusFilter(e.target.value)}
					aria-label={t('orders.allStatuses')}
				>
					<option value="all">{t('orders.allStatuses')}</option>
					<option value="active">{t('orders.statusActive')}</option>
					<option value="delivered">{t('orders.statusDelivered')}</option>
					<option value="cancelled">{t('orders.statusCancelled')}</option>
				</select>
			</div>

			{byYear.length === 0 && (
				<div className="notice notice--info">
					{orders.length === 0 ? t('orders.noOrders') : t('orders.noResults')}
				</div>
			)}

			{byYear.map(([year, yearOrders]) => (
				<div key={year} className="stack">
					<h2 className="section-title" style={{ marginBottom: 8, borderBottom: '1px solid var(--color-border, #e0e0e0)', paddingBottom: 4 }}>
						{year}
					</h2>
					<div className="order-list">
						{yearOrders.map((order) => (
							<article className="card order-item" key={order.id}>
								<div className="inline-actions" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
									<div>
										<h3 style={{ marginBottom: 4 }}>{order.id}</h3>
										<p className="helper-text">
											{new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
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
											{expanded === order.id ? t('orders.close') : t('orders.viewDetail')}
										</button>
									</div>
								</div>

								{expanded === order.id ? (
									<div className="panel stack" style={{ marginTop: 16 }}>
										<h4>{t('orders.products')}</h4>
										{order.items.map((item) => {
											const product = products.find((p) => p.id === item.productId);
											return (
												<div key={item.productId} className="inline-actions">
													<span>{product?.name || item.productId}</span>
													<span className="helper-text">× {item.quantity} — {product ? formatPrice(product.priceCents * item.quantity) : '–'}</span>
												</div>
											);
										})}
										<hr />
										<p><strong>{t('orders.total')} {formatPrice(order.totalCents)}</strong></p>
										{order.billingAddress ? (
											<>
												<h4>{t('orders.billingAddress')}</h4>
												<p>{order.billingAddress.firstName} {order.billingAddress.lastName}</p>
												<p>{order.billingAddress.address1}, {order.billingAddress.city} {order.billingAddress.postalCode}</p>
											</>
										) : null}
										{order.paymentSummary ? (
											<>
												<h4>{t('orders.payment')}</h4>
												<p>{order.paymentSummary}</p>
											</>
										) : null}
										{invoiceError && expanded === order.id && (
											<div className="notice notice--warning" role="alert" style={{ marginTop: 8 }}>
												{invoiceError}
											</div>
										)}
										<div className="page-actions" style={{ justifyContent: 'flex-start', gap: 8 }}>
											<button
												type="button"
												className="btn btn--secondary"
												disabled={invoiceLoading === order.id}
												onClick={() => downloadInvoice(order.id)}
											>
												{invoiceLoading === order.id ? t('orders.downloading') : t('orders.downloadInvoice')}
											</button>
											{onAddToCart && (
												<button
													type="button"
													className="btn btn--primary"
													onClick={() => {
														order.items.forEach((item) => onAddToCart(item.productId, item.quantity));
														onNavigate('/cart');
													}}
												>
													{t('orders.reorder')}
												</button>
											)}
										</div>
									</div>
								) : null}
							</article>
						))}
					</div>
				</div>
			))}

			<div className="page-actions" style={{ marginTop: 32 }}>
				<button className="btn btn--secondary" type="button" onClick={() => onNavigate('/account')}>{t('orders.back')}</button>
			</div>
		</section>
	);
}
