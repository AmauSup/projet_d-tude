import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import './Category.css';
import { formatPrice } from '../../utils/storefront.js';

const PAGE_SIZE = 12;

export default function Category({ categories = [], activeCategory, products = [], onSelectCategory, onOpenProduct }) {
	const [availableOnly, setAvailableOnly] = useState(false);
	const [priorityOnly, setPriorityOnly] = useState(false);
	const [page, setPage] = useState(1);

	const filteredProducts = useMemo(
		() =>
			products.filter((product) => {
				if (availableOnly && product.availableStock <= 0) return false;
				if (priorityOnly && product.priorityRank <= 0) return false;
				return true;
			}),
		[availableOnly, priorityOnly, products],
	);

	const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
	const currentPage = Math.min(page, totalPages);
	const paginated = filteredProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

	const handleFilterChange = (setter) => (event) => {
		setter(event.target.checked);
		setPage(1);
	};

	return (
		<section className="page category-page">
			<header className="page__header">
				<h1 className="page__title">Catalogue — {activeCategory?.name}</h1>
				<p className="page__subtitle">
					{filteredProducts.length} produit{filteredProducts.length === 1 ? '' : 's'}
				</p>
			</header>

			<div className="category-hero">
				{activeCategory?.imageUrl ? (
					<img
						src={activeCategory.imageUrl}
						alt={activeCategory.name}
						className="category-hero__image"
					/>
				) : (
					<div className="category-hero__image category-hero__image--placeholder" aria-hidden="true" />
				)}
				<div className="category-hero__content">
					<h2>{activeCategory?.name}</h2>
					<p>{activeCategory?.description}</p>
				</div>
			</div>

			<div className="category-layout">
				<aside className="category-filters">
					<h3>Navigation &amp; filtres</h3>
					<label htmlFor="cat-select" className="form-label">Catégorie</label>
					<select
						id="cat-select"
						className="select"
						value={activeCategory?.slug}
						onChange={(event) => { onSelectCategory(event.target.value); setPage(1); }}
					>
						{categories.map((category) => (
							<option key={category.id} value={category.slug}>{category.name}</option>
						))}
					</select>
					<label>
						<input type="checkbox" checked={availableOnly} onChange={handleFilterChange(setAvailableOnly)} />
						{' '}Disponible uniquement
					</label>
					<label>
						<input type="checkbox" checked={priorityOnly} onChange={handleFilterChange(setPriorityOnly)} />
						{' '}Prioritaire back-office
					</label>
				</aside>

				<div>
					<div className="card-grid">
						{paginated.map((product) => (
							<article
								className={`card category-card ${product.availableStock <= 0 ? 'is-unavailable' : ''}`}
								key={product.id}
							>
								{product.image ? (
									<img src={product.image} alt={product.name} className="card__image" style={{ objectFit: 'cover' }} />
								) : (
									<div className="card__image" aria-hidden="true" />
								)}
								<h3>{product.name}</h3>
								<p>{product.shortDescription}</p>
								<div className="inline-actions">
									<span className={`status-pill ${product.availableStock > 0 ? 'status-pill--ok' : 'status-pill--danger'}`}>
										{product.availableStock > 0 ? `${product.availableStock} en stock` : 'En rupture de stock'}
									</span>
									{product.priorityRank > 0 && (
										<span className="status-pill status-pill--warning">Prioritaire</span>
									)}
								</div>
								<strong>{formatPrice(product.priceCents)}</strong>
								<button className="btn btn--secondary" type="button" onClick={() => onOpenProduct(product.slug)}>
									Voir le produit
								</button>
							</article>
						))}
						{paginated.length === 0 && (
							<div className="notice notice--warning">Aucun produit pour ces filtres.</div>
						)}
					</div>

					{totalPages > 1 && (
						<nav className="pagination" aria-label="Pagination">
							<button
								className="pagination__btn"
								type="button"
								disabled={currentPage === 1}
								onClick={() => setPage((p) => p - 1)}
								aria-label="Page précédente"
							>
								‹
							</button>
							{Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
								<button
									key={p}
									type="button"
									className={`pagination__btn ${p === currentPage ? 'pagination__btn--active' : ''}`}
									onClick={() => setPage(p)}
									aria-current={p === currentPage ? 'page' : undefined}
								>
									{p}
								</button>
							))}
							<button
								className="pagination__btn"
								type="button"
								disabled={currentPage === totalPages}
								onClick={() => setPage((p) => p + 1)}
								aria-label="Page suivante"
							>
								›
							</button>
						</nav>
					)}
				</div>
			</div>
		</section>
	);
}

Category.propTypes = {
	categories: PropTypes.array,
	activeCategory: PropTypes.shape({
		id: PropTypes.number,
		name: PropTypes.string,
		slug: PropTypes.string,
		description: PropTypes.string,
		imageUrl: PropTypes.string,
	}),
	products: PropTypes.array,
	onSelectCategory: PropTypes.func.isRequired,
	onOpenProduct: PropTypes.func.isRequired,
};
