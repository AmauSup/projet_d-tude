import React from 'react';
import './Account.css';

export default function Account() {
	return (
		<section className="page account-page">
			<header className="page__header">
				<h1 className="page__title">Mon compte</h1>
				<p className="page__subtitle">Gérez profil, adresses de facturation/livraison et moyens de paiement.</p>
			</header>

			<div className="account-sections">
				<article className="card">
					<h3>Profil</h3>
					<div className="form-grid">
						<input className="input" placeholder="Nom" />
						<input className="input" placeholder="Prénom" />
						<input className="input" placeholder="Téléphone" />
					</div>
				</article>

				<article className="card">
					<h3>Adresse de facturation</h3>
					<div className="form-grid">
						<input className="input" placeholder="Adresse 1" />
						<input className="input" placeholder="Adresse 2 (optionnel)" />
						<input className="input" placeholder="Code postal" />
						<input className="input" placeholder="Ville" />
						<input className="input" placeholder="Région" />
						<input className="input" placeholder="Pays" />
					</div>
				</article>
			</div>
		</section>
	);
}
