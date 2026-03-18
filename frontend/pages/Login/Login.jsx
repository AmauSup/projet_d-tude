import React from 'react';
import './Login.css';

export default function Login() {
	return (
		<section className="page auth-page">
			<header className="page__header">
				<h1 className="page__title">Connexion</h1>
				<p className="page__subtitle">Accédez à votre espace client Althea Medical.</p>
			</header>

			<div className="form-grid">
				<input className="input" placeholder="Adresse e-mail" />
				<input className="input" type="password" placeholder="Mot de passe" />
			</div>

			<button className="btn btn--primary auth-action" type="button">Se connecter</button>
		</section>
	);
}
