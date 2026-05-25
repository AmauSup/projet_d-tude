import React, { useMemo, useState } from 'react';
import './OrderHistory.css';
import { formatPrice } from '../../utils/storefront.js';

export default function OrderHistory({ orders = [], products = [], onNavigate }) {
	const [expanded, setExpanded] = useState(null);
	const [filterYear, setFilterYear] = useState('all');
	const [filterStatus, setFilterStatus] = useState('all');
	const [searchQuery, setSearchQuery] = useState('');

	const years = useMemo(() => {
		const set = new Set(orders.map((o) => new Date(o.createdAt || o.created_at).getFullYear()));
		return [...set].sort((a, b) => b - a);
	}, [orders]);

	const statuses = useMemo(() => {
		const set = new Set(orders.map((o) => o.status).filter(Boolean));
		return [...set];
	}, [orders]);

	const filtered = useMemo(() => {
		const q = searchQuery.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
		return orders.filter((order) => {
			const year = new Date(order.createdAt || order.created_at).getFullYear();
			if (filterYear !== 'all' && year !== Number(filterYear)) return false;
			if (filterStatus !== 'all' && order.status !== filterStatus) return false;
			if (q) {
				const orderStr = [
					String(order.id),
					order.status || '',
					...(order.items || []).map((item) => {
						const p = products.find((pr) => pr.id === item.productId);
						return p?.name || '';
					}),
				].join(' ').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
				if (!orderStr.includes(q)) return false;
			}
			return true;
		});
	}, [orders, filterYear, filterStatus, searchQuery, products]);

	const byYear = useMemo(() => {
		const map = new Map();
		for (const order of filtered) {
			const y = new Date(order.createdAt || order.created_at).getFullYear();
			if (!map.has(y)) map.set(y, []);
			map.get(y).push(order);
		}
		return [...map.entries()].sort((a, b) => b[0] - a[0]);
	}, [filtered]);

	return (
		<section className="page order-page">
			<header className="page__header">
				<h1 className="page__title">Historique des commandes</h1>
				<p className="page__subtitle">Consultez vos commandes d'équipements médicaux et leur statut.</p>
			</header>

			<div className="inline-actions" style={{ flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
				<input
					className="input"
					style={{ minWidth: 200 }}
					placeholder="Rechercher (produit, date, n° commande…)"
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
				/>
				<select className="select" value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
					<option value="all">Toutes les années</option>
					{years.map((y) => <option key={y} value={y}>{y}</option>)}
				</select>
				<select className="select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
					<option value="all">Tous les statuts</option>
					{statuses.map((s) => <option key={s} value={s}>{s}</option>)}
				</select>
				<span className="helper-text">{filtered.length} commande{filtered.length === 1 ? '' : 's'}</span>
			</div>

			{byYear.length === 0 && (
				<div className="notice notice--info">Aucune commande pour ces critères.</div>
			)}

			{byYear.map(([year, yearOrders]) => (
				<div key={year} className="order-year-group">
					<h2 className="order-year-title" style={{ fontSize: '1.1rem', fontWeight: 700, margin: '16px 0 8px', color: 'var(--color-primary, #1a6b5a)' }}>
						{year} — {yearOrders.length} commande{yearOrders.length === 1 ? '' : 's'}
					</h2>
					<div className="order-list">
						{yearOrders.map((order) => (
							<article className="card order-item" key={order.id}>
								<div className="inline-actions" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
									<div>
										<h3 style={{ marginBottom: 4 }}>{order.id}</h3>
										<p className="helper-text">
											{new Date(order.createdAt || order.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
										</p>
									</div>
									<div className="inline-actions">
										<span className="status-pill status-pill--warning">{order.status}</span>
										<strong>{formatPrice(order.totalCents || (order.total_amount * 100))}</strong>
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
										{(order.items || []).map((item) => {
											const product = products.find((p) => p.id === item.productId || p.id === item.product_id);
											return (
												<div key={item.productId || item.product_id} className="inline-actions">
													<span>{product?.name || item.productId || item.product_id}</span>
													<span className="helper-text">× {item.quantity} — {product ? formatPrice(product.priceCents * item.quantity) : '–'}</span>
												</div>
											);
										})}
										<hr />
										<p><strong>Total : {formatPrice(order.totalCents || (order.total_amount * 100))}</strong></p>
										{order.billingAddress || order.billing_address ? (
											<>
												<h4>Adresse de facturation</h4>
												{(() => {
													const addr = order.billingAddress || (typeof order.billing_address === 'string' ? JSON.parse(order.billing_address) : order.billing_address) || {};
													return (
														<>
															<p>{addr.firstName} {addr.lastName}</p>
															<p>{addr.address1}, {addr.city} {addr.postalCode}</p>
														</>
													);
												})()}
											</>
										) : null}
										{order.paymentSummary || order.payment_summary ? (
											<>
												<h4>Paiement</h4>
												<p>{order.paymentSummary || order.payment_summary}</p>
											</>
										) : null}
									</div>
								) : null}
							</article>
						))}
					</div>
				</div>
			))}

			{orders.length === 0 ? (
				<div className="notice notice--info">Vous n'avez pas encore de commande.</div>
			) : null}

			<div className="page-actions">
				<button className="btn btn--secondary" type="button" onClick={() => onNavigate('/account')}>Retour à mon compte</button>
			</div>
		</section>
	);
}
