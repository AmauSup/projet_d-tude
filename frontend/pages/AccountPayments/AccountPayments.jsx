import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { apiClient } from '../../services/apiClient.js';
import { useI18n } from '../../contexts/I18nContext.jsx';

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
  const { t } = useI18n();
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
  const formRef = useRef(null);

  const load = () => {
    setLoading(true);
    apiClient.get('/pg/auth/payment-methods')
      .then((data) => setMethods(data.paymentMethods || []))
      .catch((err) => setError(err.message || t('app.loading')))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateForm = () => {
    const errors = {};
    if (!form.cardholder_name.trim()) errors.cardholder_name = t('payments.errorName');
    const clean = form.card_number.replace(/\s/g, '');
    if (!/^\d{13,19}$/.test(clean)) errors.card_number = t('payments.errorNumber');
    if (!/^\d{2}\/\d{2}$/.test(form.expiry)) errors.expiry = t('payments.errorExpiry');
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
      setFormMsg(err.message || t('payments.errorName'));
    } finally {
      setFormLoading(false);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await apiClient.patch(`/pg/auth/payment-methods/${id}/default`);
      setFeedback(t('payments.feedbackDefault'));
      load();
    } catch (err) {
      setFeedback(err.message || '');
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/pg/auth/payment-methods/${id}`);
      setDeleteConfirm(null);
      setFeedback(t('payments.feedbackDeleted'));
      load();
    } catch (err) {
      setFeedback(err.message || '');
    }
  };

  return (
    <section className="page">
      <header className="page__header">
        <h1 className="page__title">{t('payments.title')}</h1>
        <p className="page__subtitle">{t('payments.subtitle')}</p>
      </header>

      {error && <div className="notice notice--warning" role="alert">{error}</div>}
      {feedback && <output className="notice notice--success">{feedback}</output>}

      {deleteConfirm && (
        <dialog open className="modal-overlay" aria-modal="true">
          <div className="card stack" style={{ maxWidth: 400 }}>
            <h3>{t('payments.deleteTitle')}</h3>
            <p>{t('payments.deleteConfirm')}</p>
            <div className="inline-actions">
              <button className="btn btn--secondary" type="button" onClick={() => setDeleteConfirm(null)}>{t('payments.cancel')}</button>
              <button
                className="btn btn--primary"
                type="button"
                style={{ background: 'var(--color-danger, #c0392b)' }}
                onClick={() => handleDelete(deleteConfirm)}
              >
                {t('payments.delete')}
              </button>
            </div>
          </div>
        </dialog>
      )}

      {showForm && (
        <article className="card stack" ref={formRef}>
          <h2>{t('payments.addTitle')}</h2>
          <div className="notice notice--info">
            {t('payments.addInfo')}
          </div>
          <form className="form-grid" onSubmit={handleAdd} noValidate>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label" htmlFor="pm-name">{t('payments.cardholderName')}</label>
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
              <label className="form-label" htmlFor="pm-number">{t('payments.cardNumber')}</label>
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
              <label className="form-label" htmlFor="pm-expiry">{t('payments.expiry')}</label>
              <input
                id="pm-expiry"
                className={`input${formErrors.expiry ? ' input--error' : ''}`}
                placeholder="MM/AA"
                value={form.expiry}
                inputMode="numeric"
                maxLength={5}
                autoComplete="cc-exp"
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
                  const formatted = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
                  set('expiry', formatted);
                }}
              />
              {formErrors.expiry && <p className="helper-text helper-text--error">{formErrors.expiry}</p>}
            </div>

            <div>
              <label className="form-label" htmlFor="pm-cvv">{t('payments.cvv')}</label>
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
              <p className="helper-text">{t('payments.cvvInfo')}</p>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label" style={{ fontWeight: 400, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.is_default}
                  onChange={(e) => set('is_default', e.target.checked)}
                />{' '}
                {t('payments.setDefault')}
              </label>
            </div>

            {formMsg && <div className="notice notice--warning" style={{ gridColumn: '1 / -1' }}>{formMsg}</div>}

            <div className="inline-actions" style={{ gridColumn: '1 / -1' }}>
              <button className="btn btn--secondary" type="button" onClick={() => { setShowForm(false); setForm({ ...EMPTY_FORM }); setFormErrors({}); }}>
                {t('payments.cancel')}
              </button>
              <button className="btn btn--primary" type="submit" disabled={formLoading}>
                {formLoading ? t('payments.adding') : t('payments.addBtn')}
              </button>
            </div>
          </form>
        </article>
      )}

      {!showForm && (
        <div className="page-actions" style={{ justifyContent: 'flex-start', marginBottom: 16 }}>
          <button className="btn btn--primary" type="button" onClick={() => { setShowForm(true); setFeedback(''); setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50); }}>
            {t('payments.add')}
          </button>
        </div>
      )}

      {loading ? (
        <div className="notice notice--info">{t('payments.loading')}</div>
      ) : (
        <div className="stack">
          {methods.length === 0 && !showForm && (
            <div className="notice notice--info">{t('payments.none')}</div>
          )}
          {methods.map((pm) => (
            <article className="card" key={pm.id}>
              <div className="inline-actions" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <div>
                  {pm.is_default && (
                    <span className="status-pill status-pill--ok" style={{ marginBottom: 6, display: 'inline-block' }}>{t('payments.isDefault')}</span>
                  )}
                  <p><strong>{pm.cardholder_name}</strong></p>
                  <p>{maskNumber(pm.last4)}</p>
                  <p className="helper-text">{t('payments.expires')} {String(pm.expiry_month).padStart(2, '0')}/{pm.expiry_year}</p>
                </div>
                <div className="inline-actions">
                  {!pm.is_default && (
                    <button
                      className="btn btn--secondary"
                      type="button"
                      onClick={() => handleSetDefault(pm.id)}
                    >
                      {t('payments.setDefaultBtn')}
                    </button>
                  )}
                  <button
                    className="btn btn--secondary"
                    type="button"
                    style={{ color: 'var(--color-danger, #c0392b)' }}
                    onClick={() => { setDeleteConfirm(pm.id); setFeedback(''); }}
                  >
                    {t('payments.delete')}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="page-actions">
        <button className="btn btn--secondary" type="button" onClick={() => onNavigate('/account')}>{t('payments.back')}</button>
      </div>
    </section>
  );
}
