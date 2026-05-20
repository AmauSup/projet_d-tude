import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { authService } from '../../services/authService.js';

function getPasswordValidation(password) {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

export default function ResetPassword({ onNavigate }) {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [feedback, setFeedback] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback('');

    if (!token) {
      setFeedback('Lien de réinitialisation invalide ou expiré.');
      return;
    }
    if (!getPasswordValidation(password)) {
      setFeedback(
        'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.',
      );
      return;
    }
    if (password !== confirm) {
      setFeedback('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword({ token, newPassword: password });
      setSuccess(true);
    } catch (err) {
      setFeedback(err.message || 'Le lien est invalide ou a expiré.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <section className="page" style={{ maxWidth: 480, margin: '3rem auto' }}>
        <output className="notice notice--success">
          <strong>Mot de passe mis à jour.</strong> Vous pouvez maintenant vous connecter.
        </output>
        <div className="page-actions" style={{ marginTop: '1rem' }}>
          <button className="btn btn--primary" type="button" onClick={() => onNavigate('/login')}>
            Se connecter
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="page" style={{ maxWidth: 480, margin: '3rem auto' }}>
      <header className="page__header">
        <h1 className="page__title">Nouveau mot de passe</h1>
      </header>

      <form className="stack" onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="rp-password" className="form-label">
            Nouveau mot de passe <span aria-hidden="true">*</span>
          </label>
          <input
            id="rp-password"
            className="input"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="rp-confirm" className="form-label">
            Confirmer le mot de passe <span aria-hidden="true">*</span>
          </label>
          <input
            id="rp-confirm"
            className="input"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </div>

        {feedback ? (
          <p className="helper-text helper-text--error" role="alert">{feedback}</p>
        ) : null}

        <button className="btn btn--primary" type="submit" disabled={loading}>
          {loading ? 'Enregistrement…' : 'Enregistrer le mot de passe'}
        </button>
      </form>
    </section>
  );
}
