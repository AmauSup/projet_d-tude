import React, { useState } from 'react';
import './Register.css';

export default function Register({ onRegister, onNavigate }) {
	const [form, setForm] = useState({
		firstName: '',
		lastName: '',
		email: '',
		company: '',
		password: '',
		confirmPassword: '',
	});
	const [message, setMessage] = useState('');
	const [loading, setLoading] = useState(false);

	const handleSubmit = async () => {
		if (form.password !== form.confirmPassword) {
			setMessage('Les mots de passe doivent correspondre.');
			return;
		}
		setLoading(true);
		try {
			const result = await onRegister(form);
			setMessage(result.message);
			if (result.success) {
				onNavigate('/account');
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<section className="page auth-page">
			<header className="page__header">
				<h1 className="page__title">Créer un compte</h1>
				<p className="page__subtitle">Créez votre compte professionnel pour suivre commandes, factures et adresses.</p>
			</header>

			<div className="form-grid">
				<input className="input" placeholder="Prénom" value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} />
				<input className="input" placeholder="Nom" value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} />
				<input className="input" placeholder="Adresse e-mail professionnelle" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
				<input className="input" placeholder="Société" value={form.company} onChange={(event) => setForm({ ...form, company: event.target.value })} />
				<input className="input" type="password" placeholder="Mot de passe" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
				<input className="input" type="password" placeholder="Confirmer le mot de passe" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} />
			</div>

			<div className="notice notice--info">
				Règles de mot de passe : 8 caractères min., une majuscule, une minuscule, un chiffre, un caractère spécial.
			</div>
			{message ? (
				<div
					className={`notice ${message.includes('créé') || message.includes('Bienvenue') ? 'notice--success' : 'notice--warning'}`}
					role="alert"
				>
					{message}
				</div>
			) : null}

			<div className="page-actions">
				<button className="btn btn--secondary auth-action" type="button" onClick={() => onNavigate('/login')}>J’ai déjà un compte</button>
				<button className="btn btn--primary auth-action" type="button" onClick={handleSubmit} disabled={loading}>{loading ? 'Inscription…' : "S'inscrire"}</button>
			</div>
		</section>
	);
}
