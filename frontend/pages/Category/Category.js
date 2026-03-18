import React from 'react';
import './Category.css';

export default function Category() {
	return (
		<section className="page category-page">
			<header className="page__header">
				<h1 className="page__title">Catalogue - Catégorie</h1>
				<p className="page__subtitle">Filtrez les produits selon vos besoins.</p>
			</header>

			<div className="category-layout">
				<aside className="category-filters">
					<h3>Filtres</h3>
					<label><input type="checkbox" disabled /> En promotion</label>
					<label><input type="checkbox" disabled /> Disponible</label>
					<label><input type="checkbox" disabled /> Livraison 24h</label>
				</aside>

				<div className="card-grid">
					{Array.from({ length: 8 }).map((_, index) => (
						<article className="card" key={index}>
							<div className="card__image" />
							<h3>Produit #{index + 1}</h3>
							<p>Résumé court du produit</p>
							<strong>149,99 €</strong>
						</article>
					))}
				</div>
			</div>
		</section>
	);
}
