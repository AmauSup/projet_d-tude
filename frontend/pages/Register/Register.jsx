import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useLocation } from 'react-router-dom';
import './Register.css';

function getPasswordRules(password) {
	return {
		length: password.length >= 8,
		upper: /[A-Z]/.test(password),
		lower: /[a-z]/.test(password),
		digit: /\d/.test(password),
		special: /[^A-Za-z0-9]/.test(password),
	};
}

Register.propTypes = {
	onRegister: PropTypes.func.isRequired,
	onNavigate: PropTypes.func.isRequired,
};

export default function Register({ onRegister, onNavigate }) {
	const location = useLocation();
	const from = location.state?.from || '/account';
	const [form, setForm] = useState({
		firstName: '',
		lastName: '',
		email: '',
		company: '',
		password: '',
		confirmPassword: '',
	});
	const [touched, setTouched] = useState({});
	const [message, setMessage] = useState('');
	const [loading, setLoading] = useState(false);
	const [confirmationPending, setConfirmationPending] = useState(false);

	const passwordRules = useMemo(() => getPasswordRules(form.password), [form.password]);
	const passwordValid = Object.values(passwordRules).every(Boolean);
	const passwordsMatch = form.password === form.confirmPassword;

	const touch = (field) => setTouched((prev) => ({ ...prev, [field]: true }));

	function getFormError() {
		if (!form.firstName || !form.lastName || !form.email) return 'Tous les champs obligatoires doivent être complétés.';
		if (!passwordValid) return 'Le mot de passe ne respecte pas les règles de sécurité.';
		if (!passwordsMatch) return 'Les mots de passe ne correspondent pas.';
		return null;
	}

	const handleSubmit = async () => {
		setTouched({ firstName: true, lastName: true, email: true, password: true, confirmPassword: true });
		const formError = getFormError();
		if (formError) { setMessage(formError); return; }
		setLoading(true);
		try {
			const result = await onRegister(form);
			setMessage(result.message);
			if (result.success && result.requiresConfirmation) {
				setConfirmationPending(true);
			} else if (result.success) {
				onNavigate(from);
			}
		} finally {
			setLoading(false);
		}
	};

	if (confirmationPending) {
		return (
			<section className="page auth-page">
				<header className="page__header">
					<h1 className="page__title">Vérifiez votre e-mail</h1>
					<p className="page__subtitle">Un e-mail de confirmation a été envoyé à <strong>{form.email}</strong>.</p>
				</header>
				<output className="notice notice--success">
					<strong>Compte créé !</strong> Cliquez sur le lien dans l'e-mail pour activer votre compte (valable 24h).
					Vous pouvez naviguer sur le site, mais certaines fonctionnalités nécessitent une connexion après confirmation.
				</output>
				<div className="page-actions">
					<button className="btn btn--secondary" type="button" onClick={() => onNavigate('/')}>
						Parcourir le catalogue
					</button>
					<button className="btn btn--primary" type="button" onClick={() => onNavigate('/login')}>
						Se connecter
					</button>
				</div>
			</section>
		);
	}

	return (
		<section className="page auth-page">
			<header className="page__header">
				<h1 className="page__title">Créer un compte</h1>
				<p className="page__subtitle">Créez votre compte professionnel pour suivre commandes, factures et adresses.</p>
			</header>

			<form className="form-grid" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} noValidate>
				<div>
					<label className="form-label" htmlFor="reg-firstname">Prénom <span aria-hidden="true">*</span></label>
					<input
						id="reg-firstname"
						className={`input${touched.firstName && !form.firstName ? ' input--error' : ''}`}
						placeholder="Prénom"
						value={form.firstName}
						onChange={(e) => setForm({ ...form, firstName: e.target.value })}
						onBlur={() => touch('firstName')}
					/>
					{touched.firstName && !form.firstName && (
						<p className="helper-text helper-text--error" role="alert">Champ requis.</p>
					)}
				</div>

				<div>
					<label className="form-label" htmlFor="reg-lastname">Nom <span aria-hidden="true">*</span></label>
					<input
						id="reg-lastname"
						className={`input${touched.lastName && !form.lastName ? ' input--error' : ''}`}
						placeholder="Nom"
						value={form.lastName}
						onChange={(e) => setForm({ ...form, lastName: e.target.value })}
						onBlur={() => touch('lastName')}
					/>
					{touched.lastName && !form.lastName && (
						<p className="helper-text helper-text--error" role="alert">Champ requis.</p>
					)}
				</div>

				<div style={{ gridColumn: '1 / -1' }}>
					<label className="form-label" htmlFor="reg-email">Adresse e-mail <span aria-hidden="true">*</span></label>
					<input
						id="reg-email"
						className={`input${touched.email && !form.email ? ' input--error' : ''}`}
						type="email"
						placeholder="Adresse e-mail professionnelle"
						value={form.email}
						onChange={(e) => setForm({ ...form, email: e.target.value })}
						onBlur={() => touch('email')}
					/>
					{touched.email && !form.email && (
						<p className="helper-text helper-text--error" role="alert">Champ requis.</p>
					)}
				</div>

				<div style={{ gridColumn: '1 / -1' }}>
					<label className="form-label" htmlFor="reg-company">Société</label>
					<input
						id="reg-company"
						className="input"
						placeholder="Société (optionnel)"
						value={form.company}
						onChange={(e) => setForm({ ...form, company: e.target.value })}
					/>
				</div>

				<div>
					<label className="form-label" htmlFor="reg-password">Mot de passe <span aria-hidden="true">*</span></label>
					<input
						id="reg-password"
						className="input"
						type="password"
						placeholder="Mot de passe"
						value={form.password}
						onChange={(e) => setForm({ ...form, password: e.target.value })}
						onBlur={() => touch('password')}
						autoComplete="new-password"
					/>
					{form.password && (
						<ul className="password-rules" aria-live="polite">
							<li className={passwordRules.length ? 'rule--ok' : 'rule--fail'}>8 caractères minimum</li>
							<li className={passwordRules.upper ? 'rule--ok' : 'rule--fail'}>Une majuscule</li>
							<li className={passwordRules.lower ? 'rule--ok' : 'rule--fail'}>Une minuscule</li>
							<li className={passwordRules.digit ? 'rule--ok' : 'rule--fail'}>Un chiffre</li>
							<li className={passwordRules.special ? 'rule--ok' : 'rule--fail'}>Un caractère spécial</li>
						</ul>
					)}
				</div>

				<div>
					<label className="form-label" htmlFor="reg-confirm">Confirmer le mot de passe <span aria-hidden="true">*</span></label>
					<input
						id="reg-confirm"
						className={`input${touched.confirmPassword && form.confirmPassword && !passwordsMatch ? ' input--error' : ''}`}
						type="password"
						placeholder="Confirmer le mot de passe"
						value={form.confirmPassword}
						onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
						onBlur={() => touch('confirmPassword')}
						autoComplete="new-password"
					/>
					{touched.confirmPassword && form.confirmPassword && !passwordsMatch && (
						<p className="helper-text helper-text--error" role="alert">Les mots de passe ne correspondent pas.</p>
					)}
				</div>
			</form>

			{message ? (
				<div
					className={`notice ${message.includes('créé') || message.includes('Bienvenue') ? 'notice--success' : 'notice--warning'}`}
					role="alert"
				>
					{message}
				</div>
			) : null}

			<div className="page-actions">
				<button className="btn btn--secondary auth-action" type="button" onClick={() => onNavigate('/login')}>J'ai déjà un compte</button>
				<button className="btn btn--primary auth-action" type="button" onClick={handleSubmit} disabled={loading}>{loading ? 'Inscription…' : "S'inscrire"}</button>
			</div>
		</section>
	);
}
