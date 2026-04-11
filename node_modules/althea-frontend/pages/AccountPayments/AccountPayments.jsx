import React from 'react';

export default function AccountPayments({ user, onNavigate }) {
  return (
    <section className="page">
      <header className="page__header">
        <h1 className="page__title">Mes moyens de paiement</h1>
        <p className="page__subtitle">Affichage tokenisé/masqué uniquement.</p>
      </header>

      <div className="stack">
        {user.paymentMethods?.map((paymentMethod) => (
          <article className="panel" key={paymentMethod.id}>
            <strong>{paymentMethod.label}</strong>
            <p>{paymentMethod.cardholderName} •••• {paymentMethod.last4} — {paymentMethod.expiry}</p>
          </article>
        ))}
      </div>

      <div className="notice notice--warning">Aucune donnée sensible n’est stockée côté frontend.</div>
      <div className="notice notice--info">TODO backend: provider paiement + tokenisation.</div>

      <div className="page-actions">
        <button className="btn btn--secondary" type="button" onClick={() => onNavigate('/account')}>Retour</button>
      </div>
    </section>
  );
}
