import React from 'react';
import './Home.css';
import { formatPrice } from '../../utils/storefront.js';

export default function Home({
	homeContent,
	categories = [],
	featuredProducts = [],
	onOpenCategory,
	onOpenProduct,
	onNavigate,
}) {
	return (
		<section className="page home-page">
			<header className="page__header">
				<h1 className="page__title">Bienvenue sur Althea Medical</h1>
				<p className="page__subtitle">Une base storefront mobile-first prête à être reliée au backend, à la recherche temps réel et au back-office.</p>
			</header>

			<section className="home-carousel">
<<<<<<< HEAD
				{homeContent.carousel.map((slide) => (
=======
				{homeContent.carousel.slice(0, 4).map((slide) => (
>>>>>>> origin/main
					<article className="home-slide" key={slide.id}>
						<span className="badge">{slide.badge}</span>
						<h3>{slide.title}</h3>
						<p>{slide.text}</p>
						<button className="btn btn--secondary" type="button" onClick={() => onOpenCategory(slide.categorySlug)}>
							{slide.ctaLabel}
						</button>
					</article>
				))}
			</section>

			<div className="notice notice--info home-fixed-message">
				<strong>Message administrable :</strong> {homeContent.fixedMessage}
			</div>

			<section className="home-section">
				<h2>Catégories populaires</h2>
				<div className="card-grid">
<<<<<<< HEAD
					{categories.map((category) => (
=======
					{categories.slice(0, 4).map((category) => (
>>>>>>> origin/main
						<article className="card home-card" key={category.id}>
							<div className="card__image" />
							<h3>{category.name}</h3>
							<p>{category.description}</p>
							<button className="btn btn--secondary" type="button" onClick={() => onOpenCategory(category.slug)}>
								Ouvrir la catégorie
							</button>
						</article>
					))}
				</div>
			</section>

			<section className="home-section">
				<h2>Top produits du moment</h2>
				<div className="card-grid">
<<<<<<< HEAD
					{featuredProducts.map((product) => (
=======
					{featuredProducts.slice(0, 4).map((product) => (
>>>>>>> origin/main
						<article className="card home-card" key={product.id}>
							<div className="card__image" />
							<h3>{product.name}</h3>
							<p>{product.shortDescription}</p>
							<p className="home-price">{formatPrice(product.priceCents)}</p>
							<div className="inline-actions">
								<span className={`status-pill ${product.availableStock > 0 ? 'status-pill--ok' : 'status-pill--danger'}`}>
									{product.availableStock > 0 ? 'En stock' : 'Rupture de stock'}
								</span>
								<button className="btn btn--primary" type="button" onClick={() => onOpenProduct(product.slug)}>
									Voir la fiche
								</button>
							</div>
						</article>
					))}
				</div>
			</section>
		</section>
	);
}
