import React from 'react';
import PropTypes from 'prop-types';
import './Home.css';
import { formatPrice } from '../../utils/storefront.js';

Home.propTypes = {
  homeContent: PropTypes.shape({
    fixedMessage: PropTypes.string,
    carousel: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.number,
      title: PropTypes.string,
      subtitle: PropTypes.string,
      image_url: PropTypes.string,
      link_url: PropTypes.string,
    })),
  }).isRequired,
  categories: PropTypes.array.isRequired,
  featuredProducts: PropTypes.array.isRequired,
  onOpenCategory: PropTypes.func.isRequired,
  onOpenProduct: PropTypes.func.isRequired,
  onNavigate: PropTypes.func.isRequired,
};

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

			{homeContent.carousel.length > 0 && (
				<section className="home-carousel">
					{homeContent.carousel.slice(0, 4).map((slide) => (
						<article className="home-slide" key={slide.id}>
							{slide.image_url && (
								<img
									src={slide.image_url}
									alt={slide.title || 'Slide'}
									className="home-slide__img"
								/>
							)}
							<div className="home-slide__body">
								<h3>{slide.title}</h3>
								{slide.subtitle && <p>{slide.subtitle}</p>}
								{slide.link_url && (
									<a href={slide.link_url} className="btn btn--secondary">
										En savoir plus
									</a>
								)}
							</div>
						</article>
					))}
				</section>
			)}

			{homeContent.fixedMessage && (
				<div className="notice notice--info home-fixed-message">
					{homeContent.fixedMessage}
				</div>
			)}

			<section className="home-section">
				<h2>Catégories populaires</h2>
				<div className="card-grid">
					{categories.slice(0, 4).map((category) => (
						<article className="card home-card" key={category.id}>
							{category.imageUrl ? (
								<img
									src={category.imageUrl}
									alt={category.name}
									className="card__image"
									style={{ objectFit: 'cover' }}
								/>
							) : (
								<div className="card__image" aria-hidden="true" />
							)}
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
					{featuredProducts.slice(0, 4).map((product) => (
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
