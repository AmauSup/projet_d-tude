import React from 'react';
import './Home.css';

export default function Home() {
	return (
		<section className="page home-page">
			<header className="page__header">
				<h1 className="page__title">Bienvenue sur Althea Medical</h1>
				<p className="page__subtitle">Votre boutique e-commerce d'équipements médicaux pour cabinets et cliniques.</p>
			</header>

			<section className="home-carousel">
				<article className="home-slide">
					<span className="badge">Promo</span>
					<h3>Diagnostic & imagerie</h3>
					<p>Découvrez les meilleures offres sur les équipements de diagnostic.</p>
				</article>
				<article className="home-slide">
					<span className="badge">Nouveauté</span>
					<h3>Nouveaux dispositifs médicaux</h3>
					<p>Livraison rapide et références sélectionnées pour les professionnels.</p>
				</article>
				<article className="home-slide">
					<span className="badge">Abonnement</span>
					<h3>Maintenance & support</h3>
					<p>Profitez d'un accompagnement technique adapté à votre activité.</p>
				</article>
			</section>

			<section className="home-section">
				<h2>Catégories populaires</h2>
				<div className="card-grid">
					{['Diagnostic', 'Monitoring', 'Stérilisation', 'Imagerie', 'Consommables', 'Mobilier médical'].map((name) => (
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
					{['Échographe portable', 'Moniteur multiparamétrique', 'Autoclave classe B', 'Fauteuil d’examen électrique'].map((name) => (
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
