import React, { useState } from 'react';

export default function TwoFAVerify({ userId, rememberMe, onVerified, onNavigate }) {
	const [otp, setOtp] = useState('');
	const [message, setMessage] = useState('');
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!otp.trim()) { setMessage('Veuillez saisir le code.'); return; }
		setLoading(true);
		setMessage('');
		try {
			await onVerified({ user_id: userId, otp: otp.trim(), rememberMe });
		} catch (err) {
			setMessage(err.message || 'Code incorrect ou expiré.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<section className="page auth-page">
			<header className="page__header">
				<h1 className="page__title">Vérification administrateur</h1>
				<p className="page__subtitle">
					Un code à 6 chiffres a été envoyé à votre adresse e-mail administrateur. Saisissez-le pour finaliser la connexion.
				</p>
			</header>

			<form className="stack" onSubmit={handleSubmit} noValidate>
				<div>
					<label className="form-label" htmlFor="otp-input">Code de vérification</label>
					<input
						id="otp-input"
						className="input"
						type="text"
						inputMode="numeric"
						autoComplete="one-time-code"
						maxLength={6}
						placeholder="123456"
						value={otp}
						onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
						style={{ letterSpacing: '0.3em', fontSize: '1.4rem', textAlign: 'center' }}
					/>
				</div>

				{message && (
					<div className="notice notice--warning" role="alert">{message}</div>
				)}

				<div className="page-actions">
					<button className="btn btn--secondary auth-action" type="button" onClick={() => onNavigate('/login')}>
						Retour
					</button>
					<button className="btn btn--primary auth-action" type="submit" disabled={loading}>
						{loading ? 'Vérification…' : 'Confirmer'}
					</button>
				</div>
			</form>
		</section>
	);
}
