import React, { useState } from 'react';
<<<<<<< HEAD
import { authService } from '../../services/authService.js';
=======
>>>>>>> origin/main

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
<<<<<<< HEAD
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event) => {
=======

  const onSubmit = (event) => {
>>>>>>> origin/main
    event.preventDefault();
    if (!email.trim()) {
      return;
    }

<<<<<<< HEAD
    setIsSubmitting(true);
    try {
      await authService.forgotPassword(email);
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
=======
    // Backend hook: call password reset endpoint.
    setSubmitted(true);
>>>>>>> origin/main
  };

  return (
    <section className="page auth-page">
      <header className="page__header">
<<<<<<< HEAD
        <h1 className="page__title">Mot de passe oublie</h1>
=======
        <h1 className="page__title">Mot de passe oublié</h1>
>>>>>>> origin/main
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
<<<<<<< HEAD
        <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
          {isSubmitting ? 'Envoi...' : 'Envoyer'}
        </button>
      </form>

      {submitted ? <div className="notice notice--success">Si un compte existe, un email sera envoye.</div> : null}
=======
        <button type="submit" className="btn btn--primary">Envoyer</button>
      </form>

      {submitted ? <div className="notice notice--success">Si un compte existe, un email sera envoyé.</div> : null}
>>>>>>> origin/main
    </section>
  );
}
