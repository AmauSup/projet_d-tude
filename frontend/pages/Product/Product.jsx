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
					<span className="badge">Dispositif médical</span>
					<h1 className="page__title">Moniteur multiparamétrique M7</h1>
					<p className="product-description">
						Surveillance continue des signes vitaux (SpO2, ECG, NIBP) pour cabinets, cliniques et services d'urgence.
					</p>
					<p className="product-price">1 490,00 €</p>
					<p>Disponibilité : <strong>En stock</strong></p>

					<div className="product-cta">
						<button className="btn btn--primary" type="button">Ajouter au panier</button>
						<button className="btn btn--secondary" type="button">Acheter maintenant</button>
					</div>
				</div>
			</div>

			<section className="home-section">
				<h2>Produits similaires</h2>
				<p className="page__subtitle">Sélection aléatoire de la même catégorie (priorité aux produits disponibles).</p>
			</section>
		</section>
	);
}
