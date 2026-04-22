import React, { useState } from 'react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (event) => {
    event.preventDefault();
    if (!email.trim()) {
      return;
    }

    // Backend hook: call password reset endpoint.
    setSubmitted(true);
  };

  return (
    <section className="page auth-page">
      <header className="page__header">
        <h1 className="page__title">Mot de passe oublié</h1>
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
        <button type="submit" className="btn btn--primary">Envoyer</button>
      </form>

      {submitted ? <div className="notice notice--success">Si un compte existe, un email sera envoyé.</div> : null}
    </section>
  );
}
