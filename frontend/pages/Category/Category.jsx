import React from 'react';
import './Category.css';

export default function Category() {
	return (
		<section className="page category-page">
			<header className="page__header">
				<h1 className="page__title">Catalogue - Équipements de diagnostic</h1>
				<p className="page__subtitle">Image catégorie + description + produits triés selon les priorités du back-office.</p>
			</header>

			<div className="category-layout">
				<aside className="category-filters">
					<h3>Filtres</h3>
					<label><input type="checkbox" disabled /> En promotion</label>
					<label><input type="checkbox" disabled /> Disponible</label>
					<label><input type="checkbox" disabled /> Prioritaire back-office</label>
				</aside>

				<div className="card-grid">
					{[
						{ name: 'Tensiomètre électronique', price: '89,99 €', stock: 'Disponible' },
						{ name: 'Oxymètre de pouls', price: '49,90 €', stock: 'Disponible' },
						{ name: 'Stéthoscope cardiologie', price: '119,00 €', stock: 'Disponible' },
						{ name: 'Thermomètre infrarouge', price: '39,90 €', stock: 'Disponible' },
						{ name: 'Doppler fœtal', price: '169,00 €', stock: 'Disponible' },
						{ name: 'ECG portable', price: '599,00 €', stock: 'Disponible' },
						{ name: 'Spiromètre clinique', price: '749,00 €', stock: 'En rupture de stock' },
						{ name: 'Moniteur Holter', price: '899,00 €', stock: 'En rupture de stock' },
					].map((item) => (
						<article className="card" key={item.name}>
							<div className="card__image" />
							<h3>{item.name}</h3>
							<p>{item.stock}</p>
							<strong>{item.price}</strong>
						</article>
					))}
				</div>
			</div>
		</section>
	);
}
