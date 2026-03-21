import React, { useMemo, useState } from 'react';
import './Product.css';
import { formatPrice } from '../../utils/storefront.js';

export default function Product({ product, relatedProducts = [], onAddToCart, onBuyNow, onOpenProduct }) {
	const [activeImage, setActiveImage] = useState(0);

	const isAvailable = useMemo(() => product?.availableStock > 0, [product]);

	if (!product) {
		return (
			<section className="page product-page">
				<p>Aucun produit sélectionné.</p>
			</section>
		);
	}

	return (
		<section className="page product-page">
			<div className="product-layout">
				<div className="product-gallery">
					<div className="product-main-image">
						<div className="product-main-image__label">{product.images[activeImage]}</div>
					</div>
					<div className="product-thumbs">
						{product.images.map((image, index) => (
							<button
								key={image}
								type="button"
								className={`product-thumb ${index === activeImage ? 'is-active' : ''}`}
								onClick={() => setActiveImage(index)}
							>
								{image}
							</button>
						))}
					</div>
				</div>

				<div className="product-info">
					<span className="badge">Dispositif médical</span>
					<h1 className="page__title">{product.name}</h1>
					<p className="product-description">{product.description}</p>
					<p className="product-price">{formatPrice(product.priceCents)}</p>
					<p>
						Disponibilité :{' '}
						<strong>{isAvailable ? `${product.availableStock} unité(s) disponible(s)` : 'En rupture de stock'}</strong>
					</p>

					<article className="panel">
						<h3>Caractéristiques techniques</h3>
						<ul className="product-features">
							{product.technicalFeatures.map((feature) => (
								<li key={feature}>{feature}</li>
							))}
						</ul>
					</article>

					<div className="product-cta">
						<button className="btn btn--primary" type="button" disabled={!isAvailable} onClick={() => onAddToCart(product.id, 1)}>
							{isAvailable ? 'Ajouter au panier' : 'En rupture de stock'}
						</button>
						<button className="btn btn--secondary" type="button" disabled={!isAvailable} onClick={() => onBuyNow(product.id)}>
							Acheter maintenant
						</button>
					</div>
				</div>
			</div>

			<section className="home-section">
				<h2>Produits similaires</h2>
				<p className="page__subtitle">Même catégorie, priorité aux produits immédiatement achetables.</p>
				<div className="card-grid">
					{relatedProducts.map((relatedProduct) => (
						<article className="card" key={relatedProduct.id}>
							<div className="card__image" />
							<h3>{relatedProduct.name}</h3>
							<p>{relatedProduct.shortDescription}</p>
							<strong>{formatPrice(relatedProduct.priceCents)}</strong>
							<button className="btn btn--secondary" type="button" onClick={() => onOpenProduct(relatedProduct.slug)}>
								Voir la fiche
							</button>
						</article>
					))}
				</div>
			</section>
		</section>
	);
}
