import React from 'react';
import './Search.css';

export default function Search() {
	return (
		<section className="page search-page">
			<header className="page__header">
				<h1 className="page__title">Recherche</h1>
				<p className="page__subtitle">Recherche multi-critères: titre, description, caractéristiques, prix, catégorie, disponibilité.</p>
			</header>

			<div className="search-box">
				<input className="input" placeholder="Ex: tensiomètre" />
				<button type="button" className="btn btn--primary">Rechercher</button>
			</div>

			<div className="search-layout">
				<div className="search-results card-grid">
					{['Tensiomètre électronique', 'Autoclave classe B', 'Échographe portable', 'Oxymètre médical'].map((name) => (
						<article className="card" key={name}>
							<div className="card__image" />
							<h3>{name}</h3>
							<p>Correspondance exacte / proche / commence par / contient.</p>
						</article>
					))}
				</div>

				<aside className="search-summary">
					<h3>Tri disponible</h3>
					<p>Prix : croissant / décroissant</p>
					<p>Nouveauté : plus récent / plus ancien</p>
					<p>Disponibilité : en stock / rupture</p>
					<hr />
					<p><strong>Objectif performance : résultats &lt; 100 ms</strong></p>
					<small>Les changements back-office seront reflétés en temps réel côté recherche.</small>
				</aside>
			</div>
		</section>
	);
}
