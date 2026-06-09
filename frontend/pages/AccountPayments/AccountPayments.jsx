import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { apiClient } from '../../services/apiClient.js';

AccountPayments.propTypes = {
  onNavigate: PropTypes.func.isRequired,
};

const EMPTY_FORM = {
  cardholder_name: '',
  card_number: '',
  expiry: '',
  cvv: '',
  is_default: false,
};

function maskNumber(last4) {
  return `•••• •••• •••• ${last4}`;
}

export default function AccountPayments({ onNavigate }) {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);
  const [formMsg, setFormMsg] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [feedback, setFeedback] = useState('');

  const load = () => {
    setLoading(true);
    apiClient.get('/pg/auth/payment-methods')
      .then((data) => setMethods(data.paymentMethods || []))
      .catch((err) => setError(err.message || 'Erreur de chargement'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateForm = () => {
    const errors = {};
    if (!form.cardholder_name.trim()) errors.cardholder_name = 'Nom obligatoire.';
    const clean = form.card_number.replace(/\s/g, '');
    if (!/^\d{13,19}$/.test(clean)) errors.card_number = 'Numéro invalide (13–19 chiffres).';
    if (!/^\d{2}\/\d{2}$/.test(form.expiry)) errors.expiry = 'Format attendu : MM/AA.';
    return errors;
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    setFormLoading(true);
    setFormMsg('');
    try {
      await apiClient.post('/pg/auth/payment-methods', {
        cardholder_name: form.cardholder_name,
        card_number: form.card_number,
        expiry: form.expiry,
        is_default: form.is_default,
      });
      setShowForm(false);
      setForm({ ...EMPTY_FORM });
      load();
    } catch (err) {
      setFormMsg(err.message || 'Erreur lors de l\'ajout.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await apiClient.patch(`/pg/auth/payment-methods/${id}/default`);
      setFeedback('Carte définie par défaut.');
      load();
    } catch (err) {
      setFeedback(err.message || 'Erreur.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/pg/auth/payment-methods/${id}`);
      setDeleteConfirm(null);
      setFeedback('Carte supprimée.');
      load();
    } catch (err) {
      setFeedback(err.message || 'Erreur lors de la suppression.');
    }
  };

  return (
    <section className="page">
      <header className="page__header">
        <h1 className="page__title">Mes moyens de paiement</h1>
        <p className="page__subtitle">Gérez vos cartes enregistrées. Seuls les 4 derniers chiffres sont conservés.</p>
      </header>

      {error && <div className="notice notice--warning" role="alert">{error}</div>}
      {feedback && <output className="notice notice--success">{feedback}</output>}

      {/* Modale de confirmation de suppression */}
      {deleteConfirm && (
        <dialog open className="modal-overlay" aria-modal="true">
          <div className="card stack" style={{ maxWidth: 400 }}>
            <h3>Supprimer cette carte ?</h3>
            <p>Cette action est irréversible.</p>
            <div className="inline-actions">
              <button className="btn btn--secondary" type="button" onClick={() => setDeleteConfirm(null)}>Annuler</button>
              <button
                className="btn btn--primary"
                type="button"
                style={{ background: 'var(--color-danger, #c0392b)' }}
                onClick={() => handleDelete(deleteConfirm)}
              >
                Supprimer
              </button>
            </div>
          </div>
        </dialog>
      )}

      {/* Formulaire ajout */}
      {showForm && (
        <article className="card stack">
          <h2>Ajouter une carte</h2>
          <div className="notice notice--info">
            Vos données de carte ne sont pas stockées — seuls les 4 derniers chiffres et la date d'expiration sont conservés.
          </div>
          <form className="form-grid" onSubmit={handleAdd} noValidate>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label" htmlFor="pm-name">Nom sur la carte *</label>
              <input
                id="pm-name"
                className={`input${formErrors.cardholder_name ? ' input--error' : ''}`}
                placeholder="Prénom NOM"
                value={form.cardholder_name}
                onChange={(e) => set('cardholder_name', e.target.value)}
              />
              {formErrors.cardholder_name && <p className="helper-text helper-text--error">{formErrors.cardholder_name}</p>}
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label" htmlFor="pm-number">Numéro de carte *</label>
              <input
                id="pm-number"
                className={`input${formErrors.card_number ? ' input--error' : ''}`}
                placeholder="1234 5678 9012 3456"
                value={form.card_number}
                onChange={(e) => set('card_number', e.target.value)}
                maxLength={19}
                autoComplete="cc-number"
              />
              {formErrors.card_number && <p className="helper-text helper-text--error">{formErrors.card_number}</p>}
            </div>

            <div>
              <label className="form-label" htmlFor="pm-expiry">Expiration *</label>
              <input
                id="pm-expiry"
                className={`input${formErrors.expiry ? ' input--error' : ''}`}
                placeholder="MM/AA"
                value={form.expiry}
                onChange={(e) => set('expiry', e.target.value)}
                maxLength={5}
                autoComplete="cc-exp"
              />
              {formErrors.expiry && <p className="helper-text helper-text--error">{formErrors.expiry}</p>}
            </div>

            <div>
              <label className="form-label" htmlFor="pm-cvv">CVV</label>
              <input
                id="pm-cvv"
                className="input"
                placeholder="123"
                value={form.cvv}
                onChange={(e) => set('cvv', e.target.value)}
                maxLength={4}
                autoComplete="cc-csc"
                type="password"
              />
              <p className="helper-text">Le CVV n'est jamais stocké.</p>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label" style={{ fontWeight: 400, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.is_default}
                  onChange={(e) => set('is_default', e.target.checked)}
                />{' '}
                Définir comme carte par défaut
              </label>
            </div>

            {formMsg && <div className="notice notice--warning" style={{ gridColumn: '1 / -1' }}>{formMsg}</div>}

            <div className="inline-actions" style={{ gridColumn: '1 / -1' }}>
              <button className="btn btn--secondary" type="button" onClick={() => { setShowForm(false); setForm({ ...EMPTY_FORM }); setFormErrors({}); }}>
                Annuler
              </button>
              <button className="btn btn--primary" type="submit" disabled={formLoading}>
                {formLoading ? 'Ajout en cours…' : 'Ajouter la carte'}
              </button>
            </div>
          </form>
        </article>
      )}

      {!showForm && (
        <div className="page-actions" style={{ justifyContent: 'flex-start', marginBottom: 16 }}>
          <button className="btn btn--primary" type="button" onClick={() => { setShowForm(true); setFeedback(''); }}>
            + Ajouter une carte
          </button>
        </div>
      )}

      {loading ? (
        <div className="notice notice--info">Chargement…</div>
      ) : (
        <div className="stack">
          {methods.length === 0 && !showForm && (
            <div className="notice notice--info">Aucune carte enregistrée.</div>
          )}
          {methods.map((pm) => (
            <article className="card" key={pm.id}>
              <div className="inline-actions" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <div>
                  {pm.is_default && (
                    <span className="status-pill status-pill--ok" style={{ marginBottom: 6, display: 'inline-block' }}>Par défaut</span>
                  )}
                  <p><strong>{pm.cardholder_name}</strong></p>
                  <p>{maskNumber(pm.last4)}</p>
                  <p className="helper-text">Expire {String(pm.expiry_month).padStart(2, '0')}/{pm.expiry_year}</p>
                </div>
                <div className="inline-actions">
                  {!pm.is_default && (
                    <button
                      className="btn btn--secondary"
                      type="button"
                      onClick={() => handleSetDefault(pm.id)}
                    >
                      Définir par défaut
                    </button>
                  )}
                  <button
                    className="btn btn--secondary"
                    type="button"
                    style={{ color: 'var(--color-danger, #c0392b)' }}
                    onClick={() => { setDeleteConfirm(pm.id); setFeedback(''); }}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="page-actions">
        <button className="btn btn--secondary" type="button" onClick={() => onNavigate('/account')}>Retour</button>
      </div>
    </section>
  );
}
