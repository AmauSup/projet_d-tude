import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import './Login.css';

export default function Login({ onLogin, onNavigate }) {
	const location = useLocation();
	const from = location.state?.from || '/account';

	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [rememberMe, setRememberMe] = useState(false);
	const [message, setMessage] = useState('');

	const handleSubmit = (event) => {
		event.preventDefault();
		const result = onLogin({ email, password });
		setMessage(result.message);

		if (result.success) {
			onNavigate(from);
		}
	};

	return (
		<section className="page auth-page">
			<header className="page__header">
				<h1 className="page__title">Connexion</h1>
				<p className="page__subtitle">Accédez à votre espace client Althea Medical.</p>
			</header>

			<form className="stack" onSubmit={handleSubmit} noValidate>
				<div>
					<label htmlFor="login-email" className="form-label">Adresse e-mail</label>
					<input
						id="login-email"
						className="input"
						type="email"
						placeholder="votre@email.fr"
						value={email}
						onChange={(event) => setEmail(event.target.value)}
						autoComplete="email"
					/>
				</div>
				<div>
					<label htmlFor="login-password" className="form-label">Mot de passe</label>
					<input
						id="login-password"
						className="input"
						type="password"
						placeholder="Mot de passe"
						value={password}
						onChange={(event) => setPassword(event.target.value)}
						autoComplete="current-password"
					/>
				</div>

				<div className="inline-actions" style={{ justifyContent: 'space-between' }}>
					<label className="form-label" style={{ fontWeight: 400, cursor: 'pointer' }}>
						<input
							type="checkbox"
							checked={rememberMe}
							onChange={(event) => setRememberMe(event.target.checked)}
						/>{' '}
						Se souvenir de moi
					</label>
					<button type="button" className="btn btn--link" onClick={() => onNavigate('/forgot')}>
						Mot de passe oublié ?
					</button>
				</div>

				{message ? (
					<div
						className={`notice ${message.includes('réussie') ? 'notice--success' : 'notice--warning'}`}
						role="alert"
					>
						{message}
					</div>
				) : null}

				<div className="page-actions">
					<button className="btn btn--secondary auth-action" type="button" onClick={() => onNavigate('/register')}>
						Créer un compte
					</button>
					<button className="btn btn--primary auth-action" type="submit">
						Se connecter
					</button>
				</div>
			</form>
		</section>
	);
}
