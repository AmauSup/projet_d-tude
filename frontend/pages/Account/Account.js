import React from 'react';
import './Account.css';

export default function Account() {
	return (
		<section className="page account-page">
			<header className="page__header">
				<h1 className="page__title">Mon compte</h1>
				<p className="page__subtitle">Mettez à jour vos informations personnelles.</p>
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
					<h3>Adresse principale</h3>
					<div className="form-grid">
						<input className="input" placeholder="Adresse" />
						<input className="input" placeholder="Code postal" />
						<input className="input" placeholder="Ville" />
					</div>
				</article>
			</div>
		</section>
	);
}
