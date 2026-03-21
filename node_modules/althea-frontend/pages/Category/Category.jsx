import React, { useMemo, useState } from 'react';
import './Category.css';
import { formatPrice } from '../../utils/storefront.js';

export default function Category({ categories = [], activeCategory, products = [], onSelectCategory, onOpenProduct }) {
	const [availableOnly, setAvailableOnly] = useState(false);
	const [priorityOnly, setPriorityOnly] = useState(false);

	const filteredProducts = useMemo(
		() =>
			products.filter((product) => {
				if (availableOnly && product.availableStock <= 0) {
					return false;
				}

				if (priorityOnly && product.priorityRank <= 0) {
					return false;
				}

				return true;
			}),
		[availableOnly, priorityOnly, products],
	);

	return (
		<section className="page category-page">
			<header className="page__header">
				<h1 className="page__title">Catalogue — {activeCategory?.name}</h1>
				<p className="page__subtitle">Tri métier : produits prioritaires puis disponibles, les ruptures de stock restant visibles en bas.</p>
			</header>

			<div className="category-hero">
				<div className="card__image category-hero__image" />
				<div className="category-hero__content">
					<span className="badge">{activeCategory?.heroLabel}</span>
					<h2>{activeCategory?.name}</h2>
					<p>{activeCategory?.description}</p>
				</div>
			</div>

			<div className="category-layout">
				<aside className="category-filters">
					<h3>Navigation & filtres</h3>
					<select className="select" value={activeCategory?.slug} onChange={(event) => onSelectCategory(event.target.value)}>
						{categories.map((category) => (
							<option key={category.id} value={category.slug}>{category.name}</option>
						))}
					</select>
					<label><input type="checkbox" checked={availableOnly} onChange={(event) => setAvailableOnly(event.target.checked)} /> Disponible uniquement</label>
					<label><input type="checkbox" checked={priorityOnly} onChange={(event) => setPriorityOnly(event.target.checked)} /> Prioritaire back-office</label>
				</aside>

				<div className="card-grid">
					{filteredProducts.map((product) => (
						<article className={`card category-card ${product.availableStock <= 0 ? 'is-unavailable' : ''}`} key={product.id}>
							<div className="card__image" />
							<h3>{product.name}</h3>
							<p>{product.shortDescription}</p>
							<div className="inline-actions">
								<span className={`status-pill ${product.availableStock > 0 ? 'status-pill--ok' : 'status-pill--danger'}`}>
									{product.availableStock > 0 ? `${product.availableStock} en stock` : 'En rupture de stock'}
								</span>
								{product.priorityRank > 0 ? <span className="status-pill status-pill--warning">Prioritaire #{product.priorityRank}</span> : null}
							</div>
							<strong>{formatPrice(product.priceCents)}</strong>
							<button className="btn btn--secondary" type="button" onClick={() => onOpenProduct(product.slug)}>
								Voir le produit
							</button>
						</article>
					))}
				</div>
			</div>
		</section>
	);
}
