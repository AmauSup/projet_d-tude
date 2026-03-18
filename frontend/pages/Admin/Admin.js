import React from 'react';
import './Admin.css';

export default function Admin() {
	return (
		<section className="page admin-page">
			<header className="page__header">
				<h1 className="page__title">Backoffice Admin</h1>
				<p className="page__subtitle">Gestion globale des produits, commandes et utilisateurs.</p>
			</header>

			<div className="admin-kpis">
				<article className="card"><h3>Produits</h3><p>124 actifs</p></article>
				<article className="card"><h3>Commandes</h3><p>32 aujourd'hui</p></article>
				<article className="card"><h3>Utilisateurs</h3><p>870 inscrits</p></article>
				<article className="card"><h3>CA</h3><p>12 450 €</p></article>
			</div>

			<article className="card admin-table-placeholder">
				<h3>Table de gestion (placeholder)</h3>
				<p>Ce bloc servira pour les listings CRUD (produits/catégories/commandes/utilisateurs).</p>
			</article>
		</section>
	);
}
