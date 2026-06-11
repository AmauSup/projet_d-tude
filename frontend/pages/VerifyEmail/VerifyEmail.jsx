import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useSearchParams } from 'react-router-dom';
import { apiClient, persistAuthToken } from '../../services/apiClient.js';
import { useToast } from '../../contexts/ToastContext.jsx';

VerifyEmail.propTypes = {
  onVerified: PropTypes.func.isRequired,
  onNavigate: PropTypes.func.isRequired,
};

export default function VerifyEmail({ onVerified, onNavigate }) {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const { showToast } = useToast();
  const didVerify = useRef(false);

  useEffect(() => {
    // Guard against React StrictMode double-invocation which would consume the
    // one-time token on the first call and make the second call fail.
    if (didVerify.current) return;
    didVerify.current = true;

    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      showToast('Lien invalide : aucun token de vérification trouvé.', 'error');
      return;
    }

    apiClient.get(`/pg/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then((data) => {
        persistAuthToken(data.token, true);
        setStatus('success');
        onVerified(data);
      })
      .catch((err) => {
        const msg = err.message || 'Lien invalide ou expiré. Veuillez demander un nouveau lien.';
        setStatus('error');
        showToast(msg, 'error');
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
        <output className="notice notice--success">
          Votre adresse e-mail a été confirmée avec succès. Bienvenue sur Althea Systems !
        </output>
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
        <p className="page__subtitle">Le lien est invalide ou expiré.</p>
      </header>
      <div className="page-actions" style={{ justifyContent: 'flex-start', flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
        <button className="btn btn--primary" type="button" onClick={() => onNavigate('/resend-verification')}>
          Recevoir un nouveau lien
        </button>
        <button className="btn btn--secondary" type="button" onClick={() => onNavigate('/login')}>
          Se connecter
        </button>
      </div>
    </section>
  );
}
