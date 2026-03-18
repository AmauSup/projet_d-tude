import React from 'react';
import './Admin.css';

export default function Admin() {
	return (
		<section className="page admin-page">
			<header className="page__header">
				<h1 className="page__title">Back-office Administrateur</h1>
				<p className="page__subtitle">Gestion accueil, catégories, produits, priorités, commandes, utilisateurs et statistiques.</p>
			</header>

			<div className="admin-kpis">
				<article className="card"><h3>Produits médicaux</h3><p>124 actifs</p></article>
				<article className="card"><h3>Commandes</h3><p>32 aujourd'hui</p></article>
				<article className="card"><h3>Utilisateurs</h3><p>870 inscrits</p></article>
				<article className="card"><h3>CA matériel médical</h3><p>12 450 €</p></article>
			</div>

			<article className="card admin-table-placeholder">
				<h3>Gestion opérationnelle (placeholder)</h3>
				<p>Ce bloc servira aux écrans CRUD: carrousel accueil, catégories, priorités produits, commandes, facturation, utilisateurs.</p>
			</article>
		</section>
	);
}
