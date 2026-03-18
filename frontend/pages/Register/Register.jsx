import React from 'react';
import './Register.css';

export default function Register() {
	return (
		<section className="page auth-page">
			<header className="page__header">
				<h1 className="page__title">Créer un compte</h1>
				<p className="page__subtitle">Créez votre compte professionnel pour suivre commandes, factures et adresses.</p>
			</header>

			<div className="form-grid">
				<input className="input" placeholder="Prénom" />
				<input className="input" placeholder="Nom" />
				<input className="input" placeholder="Adresse e-mail professionnelle" />
				<input className="input" type="password" placeholder="Mot de passe" />
			</div>

			<button className="btn btn--primary auth-action" type="button">S'inscrire</button>
		</section>
	);
}
