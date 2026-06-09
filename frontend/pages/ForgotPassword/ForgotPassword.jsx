import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { authService } from '../../services/authService.js';

ForgotPassword.propTypes = {
  onNavigate: PropTypes.func.isRequired,
};

export default function ForgotPassword({ onNavigate }) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      await authService.forgotPassword(email.trim());
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <section className="page auth-page">
        <div className="notice notice--success">
          Si un compte est associé à cet email, vous recevrez un lien de réinitialisation sous peu.
        </div>
        <div className="page-actions" style={{ marginTop: '1rem' }}>
          <button type="button" className="btn btn--secondary" onClick={() => onNavigate('/login')}>
            Retour à la connexion
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="page auth-page">
      <header className="page__header">
        <h1 className="page__title">Mot de passe oublié</h1>
        <p className="page__subtitle">Saisissez votre email. Si un compte existe, vous recevrez les instructions.</p>
      </header>

      <form className="stack" onSubmit={onSubmit} noValidate>
        <div>
          <label htmlFor="forgot-email" className="form-label">Adresse email</label>
          <input
            id="forgot-email"
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>

        {error ? <p className="helper-text helper-text--error" role="alert">{error}</p> : null}

        <div className="page-actions">
          <button type="button" className="btn btn--secondary" onClick={() => onNavigate('/login')}>
            Retour
          </button>
          <button type="submit" className="btn btn--primary" disabled={loading}>
            {loading ? 'Envoi…' : 'Envoyer le lien'}
          </button>
        </div>
      </form>
    </section>
  );
}
