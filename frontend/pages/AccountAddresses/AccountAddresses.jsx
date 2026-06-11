import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { apiClient } from '../../services/apiClient.js';
import { useI18n } from '../../contexts/I18nContext.jsx';

AccountAddresses.propTypes = {
  onNavigate: PropTypes.func.isRequired,
};

const EMPTY_FORM = {
  label: '',
  first_name: '',
  last_name: '',
  address1: '',
  address2: '',
  city: '',
  postal_code: '',
  region: '',
  country: 'FR',
  phone: '',
  is_default: false,
};

export default function AccountAddresses({ onNavigate }) {
  const { t } = useI18n();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formMsg, setFormMsg] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const load = () => {
    setLoading(true);
    apiClient.get('/pg/auth/addresses')
      .then((data) => setAddresses(data.addresses || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm({ ...EMPTY_FORM }); setFormMsg(''); };
  const openEdit = (addr) => { setForm({ ...addr }); setFormMsg(''); };
  const closeForm = () => { setForm(null); setFormMsg(''); };

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    if (!form.address1 || !form.city) {
      setFormMsg(t('addresses.errorRequired'));
      return;
    }
    setFormLoading(true);
    setFormMsg('');
    try {
      if (form.id) {
        await apiClient.put(`/pg/auth/addresses/${form.id}`, form);
      } else {
        await apiClient.post('/pg/auth/addresses', form);
      }
      closeForm();
      load();
    } catch (err) {
      setFormMsg(err.message || t('addresses.errorRequired'));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/pg/auth/addresses/${id}`);
      setDeleteConfirm(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <section className="page">
        <header className="page__header"><h1 className="page__title">{t('addresses.title')}</h1></header>
        <div className="notice notice--info">{t('addresses.loading')}</div>
      </section>
    );
  }

  return (
    <section className="page">
      <header className="page__header">
        <h1 className="page__title">{t('addresses.title')}</h1>
        <p className="page__subtitle">{t('addresses.subtitle')}</p>
      </header>

      {error && <div className="notice notice--warning" role="alert">{error}</div>}

      {deleteConfirm && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="card stack" style={{ maxWidth: 400 }}>
            <h3>{t('addresses.deleteTitle')}</h3>
            <p>{t('addresses.deleteConfirm')}</p>
            <div className="inline-actions">
              <button className="btn btn--secondary" type="button" onClick={() => setDeleteConfirm(null)}>{t('addresses.cancel')}</button>
              <button className="btn btn--primary" type="button" style={{ background: 'var(--color-danger, #c0392b)' }} onClick={() => handleDelete(deleteConfirm)}>
                {t('addresses.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {form ? (
        <article className="card stack">
          <h2>{form.id ? t('addresses.editTitle') : t('addresses.addTitle')}</h2>
          <div className="form-grid">
            <div>
              <label className="form-label" htmlFor="addr-label">{t('addresses.label')}</label>
              <input id="addr-label" className="input" value={form.label} onChange={(e) => handleChange('label', e.target.value)} />
            </div>
            <div>
              <label className="form-label" htmlFor="addr-firstname">{t('addresses.firstName')}</label>
              <input id="addr-firstname" className="input" value={form.first_name} onChange={(e) => handleChange('first_name', e.target.value)} />
            </div>
            <div>
              <label className="form-label" htmlFor="addr-lastname">{t('addresses.lastName')}</label>
              <input id="addr-lastname" className="input" value={form.last_name} onChange={(e) => handleChange('last_name', e.target.value)} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label" htmlFor="addr-line1">{t('addresses.address1')} <span aria-hidden="true">*</span></label>
              <input id="addr-line1" className="input" value={form.address1} onChange={(e) => handleChange('address1', e.target.value)} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label" htmlFor="addr-line2">{t('addresses.address2')}</label>
              <input id="addr-line2" className="input" value={form.address2} onChange={(e) => handleChange('address2', e.target.value)} />
            </div>
            <div>
              <label className="form-label" htmlFor="addr-city">{t('addresses.city')} <span aria-hidden="true">*</span></label>
              <input id="addr-city" className="input" value={form.city} onChange={(e) => handleChange('city', e.target.value)} />
            </div>
            <div>
              <label className="form-label" htmlFor="addr-postal">{t('addresses.postal')}</label>
              <input id="addr-postal" className="input" value={form.postal_code} onChange={(e) => handleChange('postal_code', e.target.value)} />
            </div>
            <div>
              <label className="form-label" htmlFor="addr-region">{t('addresses.region')}</label>
              <input id="addr-region" className="input" value={form.region} onChange={(e) => handleChange('region', e.target.value)} />
            </div>
            <div>
              <label className="form-label" htmlFor="addr-country">{t('addresses.country')}</label>
              <input id="addr-country" className="input" value={form.country} onChange={(e) => handleChange('country', e.target.value)} />
            </div>
            <div>
              <label className="form-label" htmlFor="addr-phone">{t('addresses.phone')}</label>
              <input id="addr-phone" className="input" type="tel" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label" style={{ fontWeight: 400, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.is_default}
                  onChange={(e) => handleChange('is_default', e.target.checked)}
                />{' '}
                {t('addresses.setDefault')}
              </label>
            </div>
          </div>
          {formMsg && <div className="notice notice--warning" role="alert">{formMsg}</div>}
          <div className="inline-actions">
            <button className="btn btn--secondary" type="button" onClick={closeForm}>{t('addresses.cancel')}</button>
            <button className="btn btn--primary" type="button" onClick={handleSubmit} disabled={formLoading}>
              {formLoading ? t('addresses.saving') : t('addresses.save')}
            </button>
          </div>
        </article>
      ) : (
        <div className="page-actions" style={{ justifyContent: 'flex-start', marginBottom: 16 }}>
          <button className="btn btn--primary" type="button" onClick={openAdd}>{t('addresses.add')}</button>
        </div>
      )}

      <div className="stack">
        {addresses.length === 0 && !form && (
          <div className="notice notice--info">{t('addresses.none')}</div>
        )}
        {addresses.map((addr) => (
          <article className="card" key={addr.id}>
            <div className="inline-actions" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <div>
                {addr.label && <strong>{addr.label}</strong>}
                {addr.is_default && <span className="status-pill status-pill--ok" style={{ marginLeft: 8 }}>{t('addresses.isDefault')}</span>}
                <p>{addr.first_name} {addr.last_name}</p>
                <p>{addr.address1}{addr.address2 ? `, ${addr.address2}` : ''}</p>
                <p>{addr.postal_code} {addr.city}{addr.region ? `, ${addr.region}` : ''}</p>
                <p>{addr.country}{addr.phone ? ` — ${addr.phone}` : ''}</p>
              </div>
              <div className="inline-actions">
                <button className="btn btn--secondary" type="button" onClick={() => openEdit(addr)}>{t('addresses.edit')}</button>
                <button
                  className="btn btn--secondary"
                  type="button"
                  style={{ color: 'var(--color-danger, #c0392b)' }}
                  onClick={() => setDeleteConfirm(addr.id)}
                >
                  {t('addresses.delete')}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="page-actions">
        <button className="btn btn--secondary" type="button" onClick={() => onNavigate('/account')}>{t('addresses.back')}</button>
      </div>
    </section>
  );
}
