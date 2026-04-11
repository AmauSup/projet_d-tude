import React from 'react';

export default function AccountAddresses({ user, onNavigate }) {
  return (
    <section className="page">
      <header className="page__header">
        <h1 className="page__title">Mes adresses</h1>
        <p className="page__subtitle">Gestion des adresses de livraison/facturation.</p>
      </header>

      <div className="stack">
        {user.addresses?.map((address) => (
          <article className="panel" key={address.id}>
            <strong>{address.label}</strong>
            <p>{address.address1}, {address.postalCode} {address.city}</p>
          </article>
        ))}
      </div>

      <div className="notice notice--info">TODO backend: CRUD adresses utilisateur.</div>
      <div className="page-actions">
        <button className="btn btn--secondary" type="button" onClick={() => onNavigate('/account')}>Retour</button>
      </div>
    </section>
  );
}
