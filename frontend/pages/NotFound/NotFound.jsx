import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="page">
      <header className="page__header">
        <h1 className="page__title">404 — Page introuvable</h1>
      </header>
      <p>La page demandée n’existe pas ou a été déplacée.</p>
      <Link className="btn btn--primary" to="/">Retour à l’accueil</Link>
    </section>
  );
}
