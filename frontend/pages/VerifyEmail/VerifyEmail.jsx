import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiClient, persistAuthToken } from '../../services/apiClient.js';

export default function VerifyEmail({ onVerified, onNavigate }) {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Lien invalide : aucun token de vérification trouvé.');
      return;
    }

    apiClient.get(`/pg/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then((data) => {
        persistAuthToken(data.token, true);
        setStatus('success');
        onVerified(data);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.message || 'Lien invalide ou expiré. Veuillez demander un nouveau lien.');
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === 'loading') {
    return (
      <section className="page auth-page">
        <div className="notice notice--info">Vérification en cours…</div>
      </section>
    );
  }

  if (status === 'success') {
    return (
      <section className="page auth-page">
        <header className="page__header">
          <h1 className="page__title">E-mail confirmé !</h1>
          <p className="page__subtitle">Votre compte est maintenant actif. Vous êtes connecté.</p>
        </header>
        <div className="notice notice--success" role="status">
          Votre adresse e-mail a été confirmée avec succès. Bienvenue sur Althea Systems !
        </div>
        <div className="page-actions">
          <button className="btn btn--primary" type="button" onClick={() => onNavigate('/account')}>
            Accéder à mon compte
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="page auth-page">
      <header className="page__header">
        <h1 className="page__title">Vérification échouée</h1>
      </header>
      <div className="notice notice--warning" role="alert">{message}</div>
      <div className="page-actions">
        <button className="btn btn--secondary" type="button" onClick={() => onNavigate('/login')}>
          Se connecter
        </button>
        <button className="btn btn--primary" type="button" onClick={() => onNavigate('/register')}>
          Créer un compte
        </button>
      </div>
    </section>
  );
}
