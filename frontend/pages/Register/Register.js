import React from 'react';
import './Register.css';

export default function Register() {
	return (
		<section className="page auth-page">
			<header className="page__header">
				<h1 className="page__title">Créer un compte</h1>
				<p className="page__subtitle">Rejoignez Althea Systems pour suivre vos commandes.</p>
			</header>

			<div className="form-grid">
				<input className="input" placeholder="Prénom" />
				<input className="input" placeholder="Nom" />
				<input className="input" placeholder="Email" />
				<input className="input" type="password" placeholder="Mot de passe" />
			</div>

			<button className="btn btn--primary auth-action" type="button">S'inscrire</button>
		</section>
	);
}
