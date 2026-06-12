import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { apiClient } from '../../services/apiClient.js';
import { useI18n } from '../../contexts/I18nContext.jsx';

AccountSettings.propTypes = {
  user: PropTypes.shape({
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    email: PropTypes.string,
  }),
  onSave: PropTypes.func.isRequired,
  onNavigate: PropTypes.func.isRequired,
  onLogout: PropTypes.func,
};

export default function AccountSettings({ user = {}, onSave, onNavigate, onLogout }) {
  const { t } = useI18n();
  const [profile, setProfile] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
  });
  const [profileMsg, setProfileMsg] = useState('');
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const [emailForm, setEmailForm] = useState({ newEmail: '', confirmPassword: '' });
  const [emailMsg, setEmailMsg] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);

  const [deletePassword, setDeletePassword] = useState('');
  const [deleteMsg, setDeleteMsg] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Moyens de paiement
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [pmLoading, setPmLoading] = useState(false);
  const [pmError, setPmError] = useState('');
  const [pmSuccess, setPmSuccess] = useState('');
  const [showAddPm, setShowAddPm] = useState(false);
  const [pmForm, setPmForm] = useState({ cardholder_name: '', card_number: '', expiry: '', is_default: false });

  useEffect(() => {
    apiClient.get('/pg/auth/payment-methods')
      .then((data) => setPaymentMethods(data.paymentMethods || []))
      .catch(() => {});
  }, []);

  const handleAddPaymentMethod = async () => {
    setPmError('');
    setPmSuccess('');
    setPmLoading(true);
    try {
      const data = await apiClient.post('/pg/auth/payment-methods', pmForm);
      setPaymentMethods((prev) => [data.paymentMethod, ...prev]);
      setPmForm({ cardholder_name: '', card_number: '', expiry: '', is_default: false });
      setShowAddPm(false);
      setPmSuccess('Moyen de paiement ajouté.');
    } catch (err) {
      setPmError(err.message || 'Erreur lors de l\'ajout.');
    } finally {
      setPmLoading(false);
    }
  };

  const handleSetDefaultPm = async (id) => {
    try {
      await apiClient.patch(`/pg/auth/payment-methods/${id}/default`);
      setPaymentMethods((prev) => prev.map((pm) => ({ ...pm, is_default: pm.id === id })));
    } catch (err) {
      setPmError(err.message || 'Erreur.');
    }
  };

  const handleDeletePm = async (id) => {
    if (!window.confirm('Supprimer ce moyen de paiement ?')) return;
    try {
      await apiClient.delete(`/pg/auth/payment-methods/${id}`);
      setPaymentMethods((prev) => prev.filter((pm) => pm.id !== id));
    } catch (err) {
      setPmError(err.message || 'Erreur.');
    }
  };

  const handleSaveProfile = async () => {
    setProfileLoading(true);
    setProfileMsg('');
    setProfileSuccess(false);
    try {
      await apiClient.put('/pg/auth/profile', {
        first_name: profile.firstName,
        last_name: profile.lastName,
      });
      onSave({ firstName: profile.firstName, lastName: profile.lastName });
      setProfileMsg(t('settings.saved'));
      setProfileSuccess(true);
    } catch (err) {
      setProfileMsg(err.message || t('settings.saved'));
      setProfileSuccess(false);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!emailForm.newEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailForm.newEmail)) {
      setEmailMsg(t('settings.errorInvalidEmail'));
      return;
    }
    if (!emailForm.confirmPassword) {
      setEmailMsg(t('settings.errorNeedPassword'));
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
      setEmailMsg(`${t('settings.changeEmailBtn')} : ${emailForm.newEmail.trim().toLowerCase()}`);
      setEmailForm({ newEmail: '', confirmPassword: '' });
    } catch (err) {
      setEmailMsg(err.message || t('settings.errorInvalidEmail'));
    } finally {
      setEmailLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteMsg('Veuillez saisir votre mot de passe pour confirmer la suppression.');
      return;
    }
    setDeleteLoading(true);
    setDeleteMsg('');
    try {
      await apiClient.delete('/pg/auth/account', { password: deletePassword });
      if (onLogout) onLogout();
      else onNavigate('/');
    } catch (err) {
      setDeleteMsg(err.message || 'Erreur lors de la suppression du compte.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwords.current) {
      setPwMsg(t('settings.errorNeedCurrent'));
      return;
    }
    if (passwords.next !== passwords.confirm) {
      setPwMsg(t('settings.errorMismatch'));
      return;
    }
    if (passwords.next.length < 8) {
      setPwMsg(t('settings.errorTooShort'));
      return;
    }
    setPwLoading(true);
    setPwMsg('');
    setPwSuccess(false);
    try {
      await apiClient.put('/pg/auth/password', {
        oldPassword: passwords.current,
        newPassword: passwords.next,
      });
      setPasswords({ current: '', next: '', confirm: '' });
      setPwMsg(t('settings.pwChanged'));
      setPwSuccess(true);
    } catch (err) {
      setPwMsg(err.message || t('settings.errorMismatch'));
      setPwSuccess(false);
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <section className="page">
      <header className="page__header">
        <h1 className="page__title">{t('settings.title')}</h1>
        <p className="page__subtitle">{t('settings.subtitle')}</p>
      </header>

      <div className="stack">
        <article className="card stack">
          <h2>{t('settings.personalInfo')}</h2>
          <div className="form-grid">
            <div>
              <label className="form-label" htmlFor="settings-firstname">{t('settings.firstName')}</label>
              <input
                id="settings-firstname"
                className="input"
                value={profile.firstName}
                onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label" htmlFor="settings-lastname">{t('settings.lastName')}</label>
              <input
                id="settings-lastname"
                className="input"
                value={profile.lastName}
                onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
              />
            </div>
          </div>
          {profileMsg && (
            <div className={`notice ${profileSuccess ? 'notice--success' : 'notice--warning'}`} role="alert">
              {profileMsg}
            </div>
          )}
          <div className="page-actions" style={{ justifyContent: 'flex-start' }}>
            <button className="btn btn--primary" type="button" onClick={handleSaveProfile} disabled={profileLoading}>
              {profileLoading ? t('settings.saving') : t('settings.save')}
            </button>
          </div>
        </article>

        <article className="card stack">
          <h2>{t('settings.changeEmail')}</h2>
          <p className="helper-text">
            {t('settings.currentEmail')} <strong>{user.email || '—'}</strong>
          </p>
          <div className="form-grid">
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label" htmlFor="settings-new-email">{t('settings.newEmail')}</label>
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
              <label className="form-label" htmlFor="settings-email-pw">{t('settings.emailPassword')}</label>
              <input
                id="settings-email-pw"
                className="input"
                type="password"
                placeholder={t('settings.currentPassword')}
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
              {emailLoading ? t('settings.changing') : t('settings.changeEmailBtn')}
            </button>
          </div>
        </article>

        <article className="card stack">
          <h2>{t('settings.changePassword')}</h2>
          <div className="form-grid">
            <div>
              <label className="form-label" htmlFor="settings-pw-current">{t('settings.currentPassword')}</label>
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
              <label className="form-label" htmlFor="settings-pw-new">{t('settings.newPassword')}</label>
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
              <label className="form-label" htmlFor="settings-pw-confirm">{t('settings.confirmPassword')}</label>
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
            {t('settings.passwordRules')}
          </div>
          {pwMsg && (
            <div className={`notice ${pwSuccess ? 'notice--success' : 'notice--warning'}`} role="alert">
              {pwMsg}
            </div>
          )}
          <div className="page-actions" style={{ justifyContent: 'flex-start' }}>
            <button className="btn btn--primary" type="button" onClick={handleChangePassword} disabled={pwLoading}>
              {pwLoading ? t('settings.changingPw') : t('settings.changePasswordBtn')}
            </button>
          </div>
        </article>
      </div>

        <article className="card stack">
          <h2>Moyens de paiement</h2>
          {pmError && <div className="notice notice--warning" role="alert">{pmError}</div>}
          {pmSuccess && <div className="notice notice--success" role="alert">{pmSuccess}</div>}

          {paymentMethods.length === 0 && !showAddPm && (
            <p className="helper-text">Aucun moyen de paiement enregistré.</p>
          )}

          {paymentMethods.map((pm) => (
            <div key={pm.id} className="panel" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ flex: 1 }}>
                <strong>•••• {pm.last4}</strong>
                <span className="helper-text" style={{ marginLeft: 8 }}>
                  {pm.cardholder_name} — exp. {String(pm.expiry_month).padStart(2, '0')}/{pm.expiry_year}
                </span>
                {pm.is_default && <span className="status-pill status-pill--ok" style={{ marginLeft: 8 }}>Défaut</span>}
              </span>
              <div className="inline-actions">
                {!pm.is_default && (
                  <button type="button" className="btn btn--secondary" onClick={() => handleSetDefaultPm(pm.id)}>
                    Définir par défaut
                  </button>
                )}
                <button type="button" className="btn btn--secondary" style={{ color: 'var(--color-danger, #c0392b)' }} onClick={() => handleDeletePm(pm.id)}>
                  Supprimer
                </button>
              </div>
            </div>
          ))}

          {showAddPm ? (
            <div className="stack" style={{ marginTop: 8 }}>
              <div className="form-grid">
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label" htmlFor="pm-name">Titulaire de la carte</label>
                  <input id="pm-name" className="input" placeholder="Prénom NOM" value={pmForm.cardholder_name}
                    onChange={(e) => setPmForm({ ...pmForm, cardholder_name: e.target.value })} />
                </div>
                <div>
                  <label className="form-label" htmlFor="pm-number">Numéro de carte</label>
                  <input id="pm-number" className="input" placeholder="1234 5678 9012 3456" maxLength={19}
                    value={pmForm.card_number}
                    onChange={(e) => setPmForm({ ...pmForm, card_number: e.target.value.replace(/[^\d ]/g, '') })} />
                </div>
                <div>
                  <label className="form-label" htmlFor="pm-expiry">Date d'expiration (MM/AA)</label>
                  <input id="pm-expiry" className="input" placeholder="MM/AA" maxLength={5}
                    value={pmForm.expiry}
                    onChange={(e) => setPmForm({ ...pmForm, expiry: e.target.value })} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input id="pm-default" type="checkbox" checked={pmForm.is_default}
                    onChange={(e) => setPmForm({ ...pmForm, is_default: e.target.checked })} />
                  <label htmlFor="pm-default" className="form-label" style={{ margin: 0 }}>Définir comme moyen de paiement par défaut</label>
                </div>
              </div>
              <div className="inline-actions">
                <button type="button" className="btn btn--secondary" onClick={() => { setShowAddPm(false); setPmError(''); }}>Annuler</button>
                <button type="button" className="btn btn--primary" onClick={handleAddPaymentMethod} disabled={pmLoading}>
                  {pmLoading ? 'Ajout…' : 'Ajouter la carte'}
                </button>
              </div>
            </div>
          ) : (
            <div className="page-actions" style={{ justifyContent: 'flex-start' }}>
              <button type="button" className="btn btn--secondary" onClick={() => { setShowAddPm(true); setPmSuccess(''); setPmError(''); }}>
                + Ajouter un moyen de paiement
              </button>
            </div>
          )}
        </article>

        <article className="card stack" style={{ borderColor: '#fca5a5' }}>
          <h2 style={{ color: '#b91c1c' }}>Supprimer mon compte</h2>
          <div className="notice notice--warning">
            Cette action est <strong>irréversible</strong>. Toutes vos données (commandes, adresses,
            méthodes de paiement) seront définitivement supprimées conformément au RGPD.
          </div>
          {!deleteConfirm ? (
            <div className="page-actions" style={{ justifyContent: 'flex-start' }}>
              <button
                type="button"
                className="btn btn--secondary"
                style={{ color: '#b91c1c', borderColor: '#fca5a5', background: '#fff1f2' }}
                onClick={() => setDeleteConfirm(true)}
              >
                Supprimer mon compte
              </button>
            </div>
          ) : (
            <>
              <div>
                <label className="form-label" htmlFor="settings-delete-pw">
                  Confirmez votre mot de passe pour supprimer le compte
                </label>
                <input
                  id="settings-delete-pw"
                  className="input"
                  type="password"
                  placeholder="Mot de passe actuel"
                  value={deletePassword}
                  onChange={(e) => { setDeletePassword(e.target.value); setDeleteMsg(''); }}
                  autoComplete="current-password"
                />
              </div>
              {deleteMsg && (
                <div className="notice notice--warning" role="alert">{deleteMsg}</div>
              )}
              <div className="inline-actions">
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => { setDeleteConfirm(false); setDeletePassword(''); setDeleteMsg(''); }}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  className="btn btn--primary"
                  style={{ background: 'linear-gradient(135deg, #b91c1c, #dc2626)', boxShadow: '0 8px 18px rgba(239,68,68,0.25)' }}
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? 'Suppression…' : 'Confirmer la suppression définitive'}
                </button>
              </div>
            </>
          )}
        </article>

      <div className="page-actions" style={{ marginTop: 32 }}>
        <button className="btn btn--secondary" type="button" onClick={() => onNavigate('/account')}>{t('settings.back')}</button>
      </div>
    </section>
  );
}
