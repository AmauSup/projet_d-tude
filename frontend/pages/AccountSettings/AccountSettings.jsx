import React, { useState } from 'react';
import { accountService } from '../../services/accountService.js';

export default function AccountSettings({ onNavigate }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState('info');
  const [submitting, setSubmitting] = useState(false);

  const passwordValid =
    newPassword.length >= 8 &&
    /[A-Z]/.test(newPassword) &&
    /[a-z]/.test(newPassword) &&
    /\d/.test(newPassword) &&
    /[^A-Za-z0-9]/.test(newPassword);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      setFeedback('Veuillez remplir tous les champs.');
      setFeedbackType('warning');
      return;
    }
    if (newPassword !== confirmPassword) {
      setFeedback('Les mots de passe ne correspondent pas.');
      setFeedbackType('warning');
      return;
    }
    if (!passwordValid) {
      setFeedback('Le mot de passe doit contenir 8+ caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.');
      setFeedbackType('warning');
      return;
    }
    setSubmitting(true);
    try {
      await accountService.changePassword({ oldPassword, newPassword });
      setFeedback('Mot de passe modifié avec succès.');
      setFeedbackType('success');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setFeedback(err.message || 'Erreur lors du changement de mot de passe.');
      setFeedbackType('warning');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="page">
      <header className="page__header">
        <h1 className="page__title">Paramètres du compte</h1>
        <p className="page__subtitle">Modifiez votre mot de passe et vos préférences.</p>
      </header>

      <div className="stack">
        <div className="panel stack">
          <h3>Changer le mot de passe</h3>
          {feedback && <div className={`notice notice--${feedbackType}`}>{feedback}</div>}
          <form onSubmit={handlePasswordChange} className="stack">
            <div>
              <label htmlFor="old-password" className="form-label">Mot de passe actuel</label>
              <input
                id="old-password"
                className="input"
                type="password"
                placeholder="Mot de passe actuel"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <div>
              <label htmlFor="new-password" className="form-label">Nouveau mot de passe</label>
              <input
                id="new-password"
                className="input"
                type="password"
                placeholder="8+ car., majuscule, chiffre, spécial"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
              {newPassword && !passwordValid && (
                <p className="helper-text" style={{ color: 'var(--color-danger, #c0392b)' }}>
                  Minimum 8 caractères avec majuscule, minuscule, chiffre et caractère spécial.
                </p>
              )}
            </div>
            <div>
              <label htmlFor="confirm-password" className="form-label">Confirmer le nouveau mot de passe</label>
              <input
                id="confirm-password"
                className="input"
                type="password"
                placeholder="Confirmer le mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="helper-text" style={{ color: 'var(--color-danger, #c0392b)' }}>Les mots de passe ne correspondent pas.</p>
              )}
            </div>
            <button type="submit" className="btn btn--primary" disabled={submitting || !oldPassword || !newPassword || !confirmPassword}>
              {submitting ? 'Enregistrement…' : 'Changer le mot de passe'}
            </button>
          </form>
        </div>
      </div>

      <div className="page-actions">
        <button className="btn btn--secondary" type="button" onClick={() => onNavigate('/account')}>Retour au compte</button>
      </div>
    </section>
  );
}
