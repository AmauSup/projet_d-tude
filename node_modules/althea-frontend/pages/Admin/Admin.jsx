import React, { useEffect, useMemo, useState } from 'react';
import './Admin.css';
import { formatPrice } from '../../utils/storefront.js';

export default function Admin({
	homeContent,
	categories = [],
	products = [],
	orders = [],
	onUpdateHomeMessage,
	onMoveCarouselSlide,
	onToggleProductPriority,
	onToggleProductAvailability,
	onToggleFeatured,
	onSetCategoryOrder,
	onOpenProduct,
}) {
	const [homeMessage, setHomeMessage] = useState(homeContent.fixedMessage);

	useEffect(() => {
		setHomeMessage(homeContent.fixedMessage);
	}, [homeContent.fixedMessage]);

	const adminMetrics = useMemo(
		() => ({
			productsCount: products.length,
			availableCount: products.filter((product) => product.availableStock > 0).length,
			ordersCount: orders.length,
			revenue: orders.reduce((sum, order) => sum + order.totalCents, 0),
		}),
		[orders, products],
	);

	return (
		<section className="page admin-page">
			<header className="page__header">
				<h1 className="page__title">Back-office Administrateur</h1>
				<p className="page__subtitle">Socle d’administration prêt pour brancher les CRUD backend produits, catégories, homepage, commandes et facturation.</p>
			</header>

			<div className="metric-grid">
				<article className="metric-card"><h3>Produits</h3><div className="metric-card__value">{adminMetrics.productsCount}</div></article>
				<article className="metric-card"><h3>Produits en stock</h3><div className="metric-card__value">{adminMetrics.availableCount}</div></article>
				<article className="metric-card"><h3>Commandes</h3><div className="metric-card__value">{adminMetrics.ordersCount}</div></article>
				<article className="metric-card"><h3>CA simulé</h3><div className="metric-card__value">{formatPrice(adminMetrics.revenue)}</div></article>
			</div>

			<div className="admin-sections">
				<article className="card stack">
					<h3>Accueil / Homepage</h3>
					<textarea className="textarea" rows="4" value={homeMessage} onChange={(event) => setHomeMessage(event.target.value)} />
					<div className="page-actions">
						<button className="btn btn--primary" type="button" onClick={() => onUpdateHomeMessage(homeMessage)}>Enregistrer le message fixe</button>
					</div>
					<div className="table-like">
						{homeContent.carousel.map((slide, index) => (
							<div className="table-like__row" key={slide.id}>
								<div>
									<strong>{index + 1}. {slide.title}</strong>
									<p className="helper-text">{slide.text}</p>
								</div>
								<span>{slide.badge}</span>
								<button className="btn btn--secondary" type="button" onClick={() => onMoveCarouselSlide(slide.id, 'up')}>Monter</button>
								<button className="btn btn--secondary" type="button" onClick={() => onMoveCarouselSlide(slide.id, 'down')}>Descendre</button>
							</div>
						))}
					</div>
				</article>

				<article className="card stack">
					<h3>Ordre des catégories</h3>
					{categories.map((category) => (
						<div className="table-like__row" key={category.id}>
							<div>
								<strong>{category.name}</strong>
								<p className="helper-text">{category.description}</p>
							</div>
							<span>Ordre actuel</span>
							<input className="input" type="number" min="1" value={category.displayOrder} onChange={(event) => onSetCategoryOrder(category.id, event.target.value)} />
							<button className="btn btn--secondary" type="button" onClick={() => onOpenProduct(products.find((product) => product.categoryId === category.id)?.slug || products[0]?.slug)}>
								Voir un produit lié
							</button>
						</div>
					))}
				</article>

				<article className="card stack">
					<h3>Produits / priorités / stock</h3>
					<div className="table-like">
						{products.map((product) => (
							<div className="table-like__row" key={product.id}>
								<div>
									<strong>{product.name}</strong>
									<p className="helper-text">{product.shortDescription}</p>
								</div>
								<span>{product.availableStock > 0 ? `${product.availableStock} stock` : 'Rupture'}</span>
								<button className="btn btn--secondary" type="button" onClick={() => onToggleProductPriority(product.id)}>
									{product.priorityRank > 0 ? 'Retirer priorité' : 'Définir prioritaire'}
								</button>
								<div className="inline-actions">
									<button className="btn btn--secondary" type="button" onClick={() => onToggleProductAvailability(product.id)}>
										{product.availableStock > 0 ? 'Passer en rupture' : 'Remettre en stock'}
									</button>
									<button className="btn btn--secondary" type="button" onClick={() => onToggleFeatured(product.id)}>
										{product.featuredRank > 0 ? 'Retirer top produit' : 'Ajouter top produit'}
									</button>
								</div>
							</div>
						))}
					</div>
				</article>
			</div>
		</section>
	);
}
