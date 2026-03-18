import React from 'react';
import './Home.css';

export default function Home() {
	return (
		<section className="page home-page">
			<header className="page__header">
				<h1 className="page__title">Bienvenue sur Althea Shop</h1>
				<p className="page__subtitle">Votre boutique e-commerce high-tech et services digitaux.</p>
			</header>

			<section className="home-carousel">
				<article className="home-slide">
					<span className="badge">Promo</span>
					<h3>Équipements gaming</h3>
					<p>Découvrez les meilleures offres du moment.</p>
				</article>
				<article className="home-slide">
					<span className="badge">Nouveauté</span>
					<h3>Nouveaux accessoires</h3>
					<p>Livraison rapide et produits sélectionnés.</p>
				</article>
				<article className="home-slide">
					<span className="badge">Abonnement</span>
					<h3>Essai gratuit</h3>
					<p>Testez nos services premium sans engagement.</p>
				</article>
			</section>

			<section className="home-section">
				<h2>Catégories populaires</h2>
				<div className="card-grid">
					{['PC Portable', 'Composants', 'Périphériques', 'Smartphone', 'Audio', 'Réseau'].map((name) => (
						<article className="card" key={name}>
							<div className="card__image" />
							<h3>{name}</h3>
						</article>
					))}
				</div>
			</section>

			<section className="home-section">
				<h2>Top produits du moment</h2>
				<div className="card-grid">
					{['UltraBook X', 'Casque Pro 7', 'Clavier RGB 2', 'Écran 27" QHD'].map((name) => (
						<article className="card" key={name}>
							<div className="card__image" />
							<h3>{name}</h3>
							<p className="home-price">À partir de 99,99 €</p>
						</article>
					))}
				</div>
			</section>
		</section>
	);
}
