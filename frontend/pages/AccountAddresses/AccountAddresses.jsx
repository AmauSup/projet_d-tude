import React, { useEffect, useState } from 'react';
import { apiClient } from '../../services/apiClient.js';

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
      setFormMsg('Adresse et ville sont obligatoires.');
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
      setFormMsg(err.message || 'Erreur lors de la sauvegarde.');
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
        <header className="page__header"><h1 className="page__title">Mes adresses</h1></header>
        <div className="notice notice--info">Chargement…</div>
      </section>
    );
  }

  return (
    <section className="page">
      <header className="page__header">
        <h1 className="page__title">Mes adresses</h1>
        <p className="page__subtitle">Gérez vos adresses de livraison et de facturation.</p>
      </header>

      {error && <div className="notice notice--warning" role="alert">{error}</div>}

      {/* Modale de confirmation de suppression */}
      {deleteConfirm && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="card stack" style={{ maxWidth: 400 }}>
            <h3>Supprimer l'adresse ?</h3>
            <p>Cette action est irréversible.</p>
            <div className="inline-actions">
              <button className="btn btn--secondary" type="button" onClick={() => setDeleteConfirm(null)}>Annuler</button>
              <button className="btn btn--primary" type="button" style={{ background: 'var(--color-danger, #c0392b)' }} onClick={() => handleDelete(deleteConfirm)}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formulaire ajout / modification */}
      {form ? (
        <article className="card stack">
          <h2>{form.id ? "Modifier l'adresse" : 'Ajouter une adresse'}</h2>
          <div className="form-grid">
            <div>
              <label className="form-label" htmlFor="addr-label">Libellé (ex : Domicile, Cabinet)</label>
              <input id="addr-label" className="input" value={form.label} onChange={(e) => handleChange('label', e.target.value)} />
            </div>
            <div>
              <label className="form-label" htmlFor="addr-firstname">Prénom</label>
              <input id="addr-firstname" className="input" value={form.first_name} onChange={(e) => handleChange('first_name', e.target.value)} />
            </div>
            <div>
              <label className="form-label" htmlFor="addr-lastname">Nom</label>
              <input id="addr-lastname" className="input" value={form.last_name} onChange={(e) => handleChange('last_name', e.target.value)} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label" htmlFor="addr-line1">Adresse <span aria-hidden="true">*</span></label>
              <input id="addr-line1" className="input" value={form.address1} onChange={(e) => handleChange('address1', e.target.value)} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label" htmlFor="addr-line2">Complément d'adresse</label>
              <input id="addr-line2" className="input" value={form.address2} onChange={(e) => handleChange('address2', e.target.value)} />
            </div>
            <div>
              <label className="form-label" htmlFor="addr-city">Ville <span aria-hidden="true">*</span></label>
              <input id="addr-city" className="input" value={form.city} onChange={(e) => handleChange('city', e.target.value)} />
            </div>
            <div>
              <label className="form-label" htmlFor="addr-postal">Code postal</label>
              <input id="addr-postal" className="input" value={form.postal_code} onChange={(e) => handleChange('postal_code', e.target.value)} />
            </div>
            <div>
              <label className="form-label" htmlFor="addr-region">Région / État</label>
              <input id="addr-region" className="input" value={form.region} onChange={(e) => handleChange('region', e.target.value)} />
            </div>
            <div>
              <label className="form-label" htmlFor="addr-country">Pays</label>
              <input id="addr-country" className="input" value={form.country} onChange={(e) => handleChange('country', e.target.value)} />
            </div>
            <div>
              <label className="form-label" htmlFor="addr-phone">Téléphone</label>
              <input id="addr-phone" className="input" type="tel" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label" style={{ fontWeight: 400, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.is_default}
                  onChange={(e) => handleChange('is_default', e.target.checked)}
                />{' '}
                Définir comme adresse par défaut
              </label>
            </div>
          </div>
          {formMsg && <div className="notice notice--warning" role="alert">{formMsg}</div>}
          <div className="inline-actions">
            <button className="btn btn--secondary" type="button" onClick={closeForm}>Annuler</button>
            <button className="btn btn--primary" type="button" onClick={handleSubmit} disabled={formLoading}>
              {formLoading ? 'Sauvegarde…' : 'Sauvegarder'}
            </button>
          </div>
        </article>
      ) : (
        <div className="page-actions" style={{ justifyContent: 'flex-start', marginBottom: 16 }}>
          <button className="btn btn--primary" type="button" onClick={openAdd}>+ Ajouter une adresse</button>
        </div>
      )}

      <div className="stack">
        {addresses.length === 0 && !form && (
          <div className="notice notice--info">Aucune adresse enregistrée.</div>
        )}
        {addresses.map((addr) => (
          <article className="card" key={addr.id}>
            <div className="inline-actions" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <div>
                {addr.label && <strong>{addr.label}</strong>}
                {addr.is_default && <span className="status-pill status-pill--ok" style={{ marginLeft: 8 }}>Par défaut</span>}
                <p>{addr.first_name} {addr.last_name}</p>
                <p>{addr.address1}{addr.address2 ? `, ${addr.address2}` : ''}</p>
                <p>{addr.postal_code} {addr.city}{addr.region ? `, ${addr.region}` : ''}</p>
                <p>{addr.country}{addr.phone ? ` — ${addr.phone}` : ''}</p>
              </div>
              <div className="inline-actions">
                <button className="btn btn--secondary" type="button" onClick={() => openEdit(addr)}>Modifier</button>
                <button
                  className="btn btn--secondary"
                  type="button"
                  style={{ color: 'var(--color-danger, #c0392b)' }}
                  onClick={() => setDeleteConfirm(addr.id)}
                >
                  Supprimer
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="page-actions">
        <button className="btn btn--secondary" type="button" onClick={() => onNavigate('/account')}>Retour</button>
      </div>
    </section>
  );
}
