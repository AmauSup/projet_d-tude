import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { apiClient } from '../../services/apiClient.js';

AccountSettings.propTypes = {
  user: PropTypes.shape({
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    email: PropTypes.string,
  }),
  onSave: PropTypes.func.isRequired,
  onNavigate: PropTypes.func.isRequired,
};

export default function AccountSettings({ user = {}, onSave, onNavigate }) {
  const [profile, setProfile] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
  });
  const [profileMsg, setProfileMsg] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  const [emailForm, setEmailForm] = useState({ newEmail: '', confirmPassword: '' });
  const [emailMsg, setEmailMsg] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);

  const handleSaveProfile = async () => {
    setProfileLoading(true);
    setProfileMsg('');
    try {
      await apiClient.put('/pg/auth/profile', {
        first_name: profile.firstName,
        last_name: profile.lastName,
      });
      onSave({ firstName: profile.firstName, lastName: profile.lastName });
      setProfileMsg('Profil mis à jour.');
    } catch (err) {
      setProfileMsg(err.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!emailForm.newEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailForm.newEmail)) {
      setEmailMsg('Adresse e-mail invalide.');
      return;
    }
    if (!emailForm.confirmPassword) {
      setEmailMsg('Veuillez confirmer votre mot de passe actuel.');
      return;
    }
    setEmailLoading(true);
    setEmailMsg('');
    try {
      await apiClient.put('/pg/auth/profile', {
        email: emailForm.newEmail.trim().toLowerCase(),
        confirm_password: emailForm.confirmPassword,
        first_name: user.firstName || '',
        last_name: user.lastName || '',
      });
      onSave({ email: emailForm.newEmail.trim().toLowerCase() });
      setEmailSuccess(true);
      setEmailMsg(`E-mail mis à jour : ${emailForm.newEmail.trim().toLowerCase()}`);
      setEmailForm({ newEmail: '', confirmPassword: '' });
    } catch (err) {
      setEmailMsg(err.message || 'Erreur lors du changement d\'e-mail.');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwords.current) {
      setPwMsg('Veuillez saisir votre mot de passe actuel.');
      return;
    }
    if (passwords.next !== passwords.confirm) {
      setPwMsg('Les nouveaux mots de passe ne correspondent pas.');
      return;
    }
    if (passwords.next.length < 8) {
      setPwMsg('Le nouveau mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    setPwLoading(true);
    setPwMsg('');
    try {
      await apiClient.put('/pg/auth/password', {
        currentPassword: passwords.current,
        newPassword: passwords.next,
      });
      setPasswords({ current: '', next: '', confirm: '' });
      setPwMsg('Mot de passe modifié avec succès.');
    } catch (err) {
      setPwMsg(err.message || 'Erreur lors du changement de mot de passe.');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <section className="page">
      <header className="page__header">
        <h1 className="page__title">Paramètres du compte</h1>
        <p className="page__subtitle">Modifiez vos informations personnelles et vos identifiants.</p>
      </header>

      <div className="stack">
        {/* Informations personnelles */}
        <article className="card stack">
          <h2>Informations personnelles</h2>
          <div className="form-grid">
            <div>
              <label className="form-label" htmlFor="settings-firstname">Prénom</label>
              <input
                id="settings-firstname"
                className="input"
                value={profile.firstName}
                onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label" htmlFor="settings-lastname">Nom</label>
              <input
                id="settings-lastname"
                className="input"
                value={profile.lastName}
                onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
              />
            </div>
          </div>
          {profileMsg && (
            <div className={`notice ${profileMsg.includes('mis à jour') ? 'notice--success' : 'notice--warning'}`} role="alert">
              {profileMsg}
            </div>
          )}
          <div className="page-actions" style={{ justifyContent: 'flex-start' }}>
            <button className="btn btn--primary" type="button" onClick={handleSaveProfile} disabled={profileLoading}>
              {profileLoading ? 'Sauvegarde…' : 'Sauvegarder'}
            </button>
          </div>
        </article>

        {/* Changement d'adresse e-mail */}
        <article className="card stack">
          <h2>Changer l'adresse e-mail</h2>
          <p className="helper-text">
            E-mail actuel : <strong>{user.email || '—'}</strong>
          </p>
          <div className="form-grid">
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label" htmlFor="settings-new-email">Nouvel e-mail</label>
              <input
                id="settings-new-email"
                className="input"
                type="email"
                placeholder="nouveau@email.fr"
                value={emailForm.newEmail}
                onChange={(e) => { setEmailForm({ ...emailForm, newEmail: e.target.value }); setEmailMsg(''); setEmailSuccess(false); }}
                autoComplete="email"
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label" htmlFor="settings-email-pw">Mot de passe actuel (confirmation)</label>
              <input
                id="settings-email-pw"
                className="input"
                type="password"
                placeholder="Votre mot de passe actuel"
                value={emailForm.confirmPassword}
                onChange={(e) => { setEmailForm({ ...emailForm, confirmPassword: e.target.value }); setEmailMsg(''); }}
                autoComplete="current-password"
              />
            </div>
          </div>
          {emailMsg && (
            <div className={`notice ${emailSuccess ? 'notice--success' : 'notice--warning'}`} role="alert">
              {emailMsg}
            </div>
          )}
          <div className="page-actions" style={{ justifyContent: 'flex-start' }}>
            <button className="btn btn--primary" type="button" onClick={handleChangeEmail} disabled={emailLoading}>
              {emailLoading ? 'Modification…' : 'Changer l\'e-mail'}
            </button>
          </div>
        </article>

        {/* Changement de mot de passe */}
        <article className="card stack">
          <h2>Changer le mot de passe</h2>
          <div className="form-grid">
            <div>
              <label className="form-label" htmlFor="settings-pw-current">Mot de passe actuel</label>
              <input
                id="settings-pw-current"
                className="input"
                type="password"
                autoComplete="current-password"
                value={passwords.current}
                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label" htmlFor="settings-pw-new">Nouveau mot de passe</label>
              <input
                id="settings-pw-new"
                className="input"
                type="password"
                autoComplete="new-password"
                value={passwords.next}
                onChange={(e) => setPasswords({ ...passwords, next: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label" htmlFor="settings-pw-confirm">Confirmer le nouveau mot de passe</label>
              <input
                id="settings-pw-confirm"
                className="input"
                type="password"
                autoComplete="new-password"
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
              />
            </div>
          </div>
          <div className="notice notice--info">
            Règles : 8 caractères min., une majuscule, une minuscule, un chiffre, un caractère spécial.
          </div>
          {pwMsg && (
            <div className={`notice ${pwMsg.includes('succès') ? 'notice--success' : 'notice--warning'}`} role="alert">
              {pwMsg}
            </div>
          )}
          <div className="page-actions" style={{ justifyContent: 'flex-start' }}>
            <button className="btn btn--primary" type="button" onClick={handleChangePassword} disabled={pwLoading}>
              {pwLoading ? 'Modification…' : 'Modifier le mot de passe'}
            </button>
          </div>
        </article>
      </div>

      <div className="page-actions" style={{ marginTop: 32 }}>
        <button className="btn btn--secondary" type="button" onClick={() => onNavigate('/account')}>Retour au compte</button>
      </div>
    </section>
  );
}
