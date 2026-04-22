import React from 'react';

export default function AccountSettings({ onNavigate }) {
  return (
    <section className="page">
      <header className="page__header">
        <h1 className="page__title">Paramètres du compte</h1>
        <p className="page__subtitle">Prépare la gestion email/mot de passe/notifications côté backend.</p>
      </header>

      <div className="stack">
        <div className="panel">TODO backend: endpoint update email, password, notification preferences.</div>
      </div>

      <div className="page-actions">
        <button className="btn btn--secondary" type="button" onClick={() => onNavigate('/account')}>Retour au compte</button>
      </div>
    </section>
  );
}
