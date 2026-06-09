import React, { useState } from 'react';
import { apiClient } from '../../services/apiClient.js';

export default function AccountSettings({ user = {}, onSave, onNavigate }) {
  const [profile, setProfile] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    email: user.email || '',
  });
  const [profileMsg, setProfileMsg] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

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
        <p className="page__subtitle">Modifiez vos informations personnelles et votre mot de passe.</p>
      </header>

      <div className="stack">
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
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label" htmlFor="settings-email">Adresse e-mail</label>
              <input id="settings-email" className="input" value={profile.email} disabled />
              <p className="helper-text" style={{ marginTop: 4 }}>La modification d'email nécessite une confirmation par e-mail.</p>
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

      <div className="page-actions">
        <button className="btn btn--secondary" type="button" onClick={() => onNavigate('/account')}>Retour au compte</button>
      </div>
    </section>
  );
}
