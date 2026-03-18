import React from 'react';
import './Contact.css';

export default function Contact() {
	return (
		<section className="page contact-page">
			<header className="page__header">
				<h1 className="page__title">Contact & Assistance</h1>
				<p className="page__subtitle">Formulaire d'aide technique/commerciale avec zone dédiée au chatbot support.</p>
			</header>

			<div className="contact-layout">
				<form className="contact-form" action="#">
					<input className="input" placeholder="Nom" />
					<input className="input" placeholder="Email" />
					<textarea className="textarea" rows="6" placeholder="Votre message" />
					<button className="btn btn--primary" type="button">Envoyer</button>
				</form>

				<aside className="chatbot-placeholder">
					<h3>Zone Chatbot support (à intégrer)</h3>
					<p>Ici sera ajouté l'assistant pour guider les clients sur produits, commandes et SAV.</p>
				</aside>
			</div>
		</section>
	);
}
