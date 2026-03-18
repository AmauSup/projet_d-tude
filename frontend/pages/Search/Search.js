import React from 'react';
import './Search.css';

export default function Search() {
	return (
		<section className="page search-page">
			<header className="page__header">
				<h1 className="page__title">Recherche</h1>
				<p className="page__subtitle">Retrouvez vos produits en quelques secondes.</p>
			</header>

			<div className="search-box">
				<input className="input" placeholder="Ex: casque bluetooth" />
				<button type="button" className="btn btn--primary">Rechercher</button>
			</div>

			<div className="search-layout">
				<div className="search-results card-grid">
					{['Résultat A', 'Résultat B', 'Résultat C', 'Résultat D'].map((name) => (
						<article className="card" key={name}>
							<div className="card__image" />
							<h3>{name}</h3>
							<p>Produit correspondant à la recherche.</p>
						</article>
					))}
				</div>

				<aside className="search-summary">
					<h3>Récapitulatif prix (simulation)</h3>
					<p>Sous-total : 199,98 €</p>
					<p>Taxes : 40,00 €</p>
					<p>Promotion : -10,00 €</p>
					<hr />
					<p><strong>Total TTC : 229,98 €</strong></p>
					<small>Le calcul s'actualisera en temps réel lors de l'ajout backend.</small>
				</aside>
			</div>
		</section>
	);
}
