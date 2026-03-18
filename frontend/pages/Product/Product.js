import React from 'react';
import './Product.css';

export default function Product() {
	return (
		<section className="page product-page">
			<div className="product-layout">
				<div className="product-gallery">
					<div className="product-main-image" />
					<div className="product-thumbs">
						<div className="product-thumb" />
						<div className="product-thumb" />
						<div className="product-thumb" />
					</div>
				</div>

				<div className="product-info">
					<span className="badge">Produit vedette</span>
					<h1 className="page__title">Nom du produit</h1>
					<p className="product-description">
						Description claire et orientée bénéfices pour aider l'utilisateur à décider rapidement.
					</p>
					<p className="product-price">499,99 €</p>

					<div className="product-cta">
						<button className="btn btn--primary" type="button">Ajouter au panier</button>
						<button className="btn btn--secondary" type="button">Démarrer l'essai gratuit</button>
					</div>
				</div>
			</div>
		</section>
	);
}
