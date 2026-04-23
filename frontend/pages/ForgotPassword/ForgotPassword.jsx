import React, { useState } from 'react';
import { authService } from '../../services/authService.js';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!email.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.forgotPassword(email);
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="page auth-page">
      <header className="page__header">
        <h1 className="page__title">Mot de passe oublie</h1>
        <p className="page__subtitle">Saisissez votre email. Si un compte existe, vous recevrez les instructions.</p>
      </header>

      <form className="stack" onSubmit={onSubmit}>
        <label htmlFor="forgot-email">Adresse email</label>
        <input
          id="forgot-email"
          className="input"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
          {isSubmitting ? 'Envoi...' : 'Envoyer'}
        </button>
      </form>

      {submitted ? <div className="notice notice--success">Si un compte existe, un email sera envoye.</div> : null}
    </section>
  );
}
