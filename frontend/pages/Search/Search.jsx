import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import './Search.css';
import { formatPrice } from '../../utils/storefront.js';

const PAGE_SIZE = 12;

export default function Search({ categories = [], criteria, onChangeCriteria, results = [], onOpenProduct }) {
	const [page, setPage] = useState(1);

	const updateCriteria = (name, value) => {
		onChangeCriteria((previous) => ({ ...previous, [name]: value }));
		setPage(1);
	};

	const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
	const currentPage = Math.min(page, totalPages);
	const paginated = useMemo(
		() => results.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
		[results, currentPage],
	);

	return (
		<section className="page search-page">
			<header className="page__header">
				<h1 className="page__title">Recherche</h1>
				<p className="page__subtitle">
					{results.length} résultat{results.length === 1 ? '' : 's'}
				</p>
			</header>

			<div className="search-layout">
				<aside className="search-filters panel">
					<h3>Filtres avancés</h3>
					<div className="stack">
						<input className="input" placeholder="Nom / titre" value={criteria.query} onChange={(event) => updateCriteria('query', event.target.value)} />
						<input className="input" placeholder="Description" value={criteria.description} onChange={(event) => updateCriteria('description', event.target.value)} />
						<input className="input" placeholder="Caractéristique technique" value={criteria.technical} onChange={(event) => updateCriteria('technical', event.target.value)} />
						<select className="select" value={criteria.categoryId} onChange={(event) => updateCriteria('categoryId', event.target.value)}>
							<option value="all">Toutes les catégories</option>
							{categories.map((category) => (
								<option key={category.id} value={category.id}>{category.name}</option>
							))}
						</select>
						<div className="search-price-row">
							<input className="input" type="number" min="0" placeholder="Prix min" value={criteria.minPrice} onChange={(event) => updateCriteria('minPrice', event.target.value)} />
							<input className="input" type="number" min="0" placeholder="Prix max" value={criteria.maxPrice} onChange={(event) => updateCriteria('maxPrice', event.target.value)} />
						</div>
						<label>
							<input type="checkbox" checked={criteria.availableOnly} onChange={(event) => updateCriteria('availableOnly', event.target.checked)} />
							{' '}Uniquement les produits disponibles
						</label>
						<div className="search-price-row">
							<select className="select" value={criteria.sortBy} onChange={(event) => updateCriteria('sortBy', event.target.value)}>
								<option value="relevance">Pertinence</option>
								<option value="price">Prix</option>
								<option value="createdAt">Nouveauté</option>
								<option value="availability">Disponibilité</option>
							</select>
							<select className="select" value={criteria.sortDirection} onChange={(event) => updateCriteria('sortDirection', event.target.value)}>
								<option value="asc">Croissant / priorité dispo</option>
								<option value="desc">Décroissant / priorité rupture</option>
							</select>
						</div>
					</div>
				</aside>

				<div className="search-results-col">
					<div className="card-grid">
						{paginated.map((product) => (
							<article className={`card ${product.availableStock <= 0 ? 'is-unavailable' : ''}`} key={product.id}>
								{product.images?.[0] ? (
									<img src={product.images[0]} alt={product.name} className="card__image" style={{ objectFit: 'cover' }} />
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
						{results.length === 0 && (
							<div className="notice notice--warning">Aucun résultat pour ces critères.</div>
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

				<aside className="search-summary">
					<h3>Résumé moteur</h3>
					<p><strong>{results.length}</strong> résultat{results.length === 1 ? '' : 's'}</p>
					<p>Ordre de matching : exact, variation d'un caractère, commence par, contient.</p>
					<p>Tri actif : {criteria.sortBy} / {criteria.sortDirection}</p>
					<hr />
					<p><strong>Objectif performance : résultats &lt; 100 ms</strong></p>
					<small>Les changements back-office sont instantanément reflétés ici car les données proviennent d'un store partagé.</small>
				</aside>
			</div>
		</section>
	);
}

Search.propTypes = {
	categories: PropTypes.array,
	criteria: PropTypes.shape({
		query: PropTypes.string,
		description: PropTypes.string,
		technical: PropTypes.string,
		categoryId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
		minPrice: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
		maxPrice: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
		availableOnly: PropTypes.bool,
		sortBy: PropTypes.string,
		sortDirection: PropTypes.string,
	}).isRequired,
	onChangeCriteria: PropTypes.func.isRequired,
	results: PropTypes.array,
	onOpenProduct: PropTypes.func.isRequired,
};
