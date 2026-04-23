import React, { useState } from 'react';
import './Contact.css';
<<<<<<< HEAD
import { supportService } from '../../services/supportService.js';

function validateForm(form) {
  const errors = {};

  if (!form.name.trim()) {
    errors.name = 'Votre nom est requis.';
  }

  if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Adresse e-mail invalide.';
  }

  if (!form.message.trim() || form.message.trim().length < 10) {
    errors.message = 'Message trop court (10 caracteres minimum).';
  }

  return errors;
}

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: 'support', message: '' });
  const [errors, setErrors] = useState({});
  const [messageSent, setMessageSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validateForm(form);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      await supportService.createContactMessage(form);
      setMessageSent(true);
    } catch (error) {
      setErrors({ form: error.message || 'Envoi impossible.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (messageSent) {
    return (
      <section className="page contact-page">
        <div className="notice notice--success" role="status">
          <strong>Message envoye !</strong> Nous vous repondrons sous 24 h a l'adresse {form.email}.
        </div>
        <div className="page-actions">
          <button
            className="btn btn--secondary"
            type="button"
            onClick={() => {
              setForm({ name: '', email: '', subject: 'support', message: '' });
              setMessageSent(false);
            }}
          >
            Envoyer un autre message
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="page contact-page">
      <header className="page__header">
        <h1 className="page__title">Contact & Assistance</h1>
        <p className="page__subtitle">Notre equipe vous repond sous 24 h.</p>
      </header>

      <div className="contact-layout">
        <form className="contact-form stack" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="contact-name" className="form-label">
              Nom complet <span aria-hidden="true">*</span>
            </label>
            <input
              id="contact-name"
              className={`input${errors.name ? ' input--error' : ''}`}
              placeholder="Votre nom"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
            {errors.name ? (
              <p className="helper-text helper-text--error" role="alert">{errors.name}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="contact-email" className="form-label">
              Adresse e-mail <span aria-hidden="true">*</span>
            </label>
            <input
              id="contact-email"
              className={`input${errors.email ? ' input--error' : ''}`}
              type="email"
              placeholder="votre@email.fr"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
            {errors.email ? (
              <p className="helper-text helper-text--error" role="alert">{errors.email}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="contact-subject" className="form-label">Sujet</label>
            <select
              id="contact-subject"
              className="select"
              value={form.subject}
              onChange={(event) => setForm({ ...form, subject: event.target.value })}
            >
              <option value="support">Support technique</option>
              <option value="commercial">Demande commerciale</option>
              <option value="commande">Suivi de commande</option>
            </select>
          </div>

          <div>
            <label htmlFor="contact-message" className="form-label">
              Message <span aria-hidden="true">*</span>
            </label>
            <textarea
              id="contact-message"
              className={`textarea${errors.message ? ' input--error' : ''}`}
              rows="6"
              placeholder="Decrivez votre demande (10 caracteres minimum)..."
              value={form.message}
              onChange={(event) => setForm({ ...form, message: event.target.value })}
            />
            {errors.message ? (
              <p className="helper-text helper-text--error" role="alert">{errors.message}</p>
            ) : null}
          </div>

          {errors.form ? <div className="notice notice--warning">{errors.form}</div> : null}

          <button className="btn btn--primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Envoi...' : 'Envoyer'}
          </button>
        </form>

        <aside className="chatbot-placeholder">
          <h3>Assistance rapide</h3>
          <p>Notre assistant guide les clients sur produits, commandes et SAV.</p>
          <div className="stack">
            <div className="panel">Questions frequentes : livraison, disponibilite, installation.</div>
            <div className="panel">
              <em>Backend connecte :</em> le message est maintenant envoye a l API JS locale.
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
=======

function validateForm(form) {
	const errors = {};

	if (!form.name.trim()) {
		errors.name = 'Votre nom est requis.';
	}

	if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
		errors.email = 'Adresse e-mail invalide.';
	}

	if (!form.message.trim() || form.message.trim().length < 10) {
		errors.message = 'Message trop court (10 caractères minimum).';
	}

	return errors;
}

export default function Contact() {
	const [form, setForm] = useState({ name: '', email: '', subject: 'support', message: '' });
	const [errors, setErrors] = useState({});
	const [messageSent, setMessageSent] = useState(false);

	const handleSubmit = (event) => {
		event.preventDefault();
		const nextErrors = validateForm(form);

		if (Object.keys(nextErrors).length > 0) {
			setErrors(nextErrors);
			return;
		}

		setErrors({});
		setMessageSent(true);
		// Backend hook: POST /api/support/contact with { name, email, subject, message }
	};

	if (messageSent) {
		return (
			<section className="page contact-page">
				<div className="notice notice--success" role="status">
					<strong>Message envoyé !</strong> Nous vous répondrons sous 24 h à l'adresse {form.email}.
				</div>
				<div className="page-actions">
					<button
						className="btn btn--secondary"
						type="button"
						onClick={() => {
							setForm({ name: '', email: '', subject: 'support', message: '' });
							setMessageSent(false);
						}}
					>
						Envoyer un autre message
					</button>
				</div>
			</section>
		);
	}

	return (
		<section className="page contact-page">
			<header className="page__header">
				<h1 className="page__title">Contact & Assistance</h1>
				<p className="page__subtitle">Notre équipe vous répond sous 24 h.</p>
			</header>

			<div className="contact-layout">
				<form className="contact-form stack" onSubmit={handleSubmit} noValidate>
					<div>
						<label htmlFor="contact-name" className="form-label">
							Nom complet <span aria-hidden="true">*</span>
						</label>
						<input
							id="contact-name"
							className={`input${errors.name ? ' input--error' : ''}`}
							placeholder="Votre nom"
							value={form.name}
							onChange={(event) => setForm({ ...form, name: event.target.value })}
						/>
						{errors.name ? (
							<p className="helper-text helper-text--error" role="alert">{errors.name}</p>
						) : null}
					</div>

					<div>
						<label htmlFor="contact-email" className="form-label">
							Adresse e-mail <span aria-hidden="true">*</span>
						</label>
						<input
							id="contact-email"
							className={`input${errors.email ? ' input--error' : ''}`}
							type="email"
							placeholder="votre@email.fr"
							value={form.email}
							onChange={(event) => setForm({ ...form, email: event.target.value })}
						/>
						{errors.email ? (
							<p className="helper-text helper-text--error" role="alert">{errors.email}</p>
						) : null}
					</div>

					<div>
						<label htmlFor="contact-subject" className="form-label">Sujet</label>
						<select
							id="contact-subject"
							className="select"
							value={form.subject}
							onChange={(event) => setForm({ ...form, subject: event.target.value })}
						>
							<option value="support">Support technique</option>
							<option value="commercial">Demande commerciale</option>
							<option value="commande">Suivi de commande</option>
						</select>
					</div>

					<div>
						<label htmlFor="contact-message" className="form-label">
							Message <span aria-hidden="true">*</span>
						</label>
						<textarea
							id="contact-message"
							className={`textarea${errors.message ? ' input--error' : ''}`}
							rows="6"
							placeholder="Décrivez votre demande (10 caractères minimum)…"
							value={form.message}
							onChange={(event) => setForm({ ...form, message: event.target.value })}
						/>
						{errors.message ? (
							<p className="helper-text helper-text--error" role="alert">{errors.message}</p>
						) : null}
					</div>

					<button className="btn btn--primary" type="submit">Envoyer</button>
				</form>

				<aside className="chatbot-placeholder">
					<h3>Assistance rapide</h3>
					<p>Notre assistant guide les clients sur produits, commandes et SAV.</p>
					<div className="stack">
						<div className="panel">Questions fréquentes : livraison, disponibilité, installation.</div>
						<div className="panel">
							<em>Backend hook :</em> branchement prévu à une base FAQ ou à un agent conversationnel.
						</div>
					</div>
				</aside>
			</div>
		</section>
	);
>>>>>>> origin/main
}
