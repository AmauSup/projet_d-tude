import React, { useState } from 'react';
import { authService } from '../../services/authService.js';

export default function ResendVerification({ onNavigate }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError('Veuillez saisir votre adresse e-mail.'); return; }
    setLoading(true);
    setError('');
    try {
      await authService.resendVerification(email.trim());
      setSent(true);
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'envoi.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <section className="page auth-page">
        <div className="notice notice--success" role="status">
          Si un compte non confirmé existe pour <strong>{email}</strong>, un nouveau lien a été envoyé. Vérifiez votre boîte mail.
        </div>
        <div className="page-actions">
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
        <h1 className="page__title">Renvoyer le lien de confirmation</h1>
        <p className="page__subtitle">Saisissez votre adresse e-mail pour recevoir un nouveau lien d'activation.</p>
      </header>
      <form className="stack" onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="resend-email" className="form-label">Adresse e-mail</label>
          <input
            id="resend-email"
            className="input"
            type="email"
            placeholder="votre@email.fr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
        {error && <div className="notice notice--warning" role="alert">{error}</div>}
        <div className="page-actions">
          <button className="btn btn--secondary" type="button" onClick={() => onNavigate('/login')}>Retour</button>
          <button className="btn btn--primary" type="submit" disabled={loading}>
            {loading ? 'Envoi…' : 'Envoyer le lien'}
          </button>
        </div>
      </form>
    </section>
  );
}
