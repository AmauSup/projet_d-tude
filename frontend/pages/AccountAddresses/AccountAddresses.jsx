import React, { useEffect, useState } from 'react';
import { apiClient } from '../../services/apiClient.js';

const EMPTY_FORM = { label: '', type: 'shipping', first_name: '', last_name: '', address1: '', address2: '', city: '', postal_code: '', region: '', country: 'France', phone: '', email: '', is_default: false };

export default function AccountAddresses({ onNavigate }) {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = () => {
    setLoading(true);
    apiClient.get('/pg/auth/addresses').then((d) => { setAddresses(d.addresses || []); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditingId(null); setForm(EMPTY_FORM); setFeedback(''); setShowForm(true); };
  const openEdit = (addr) => {
    setEditingId(addr.id);
    setForm({ label: addr.label || '', type: addr.type || 'shipping', first_name: addr.first_name || '', last_name: addr.last_name || '', address1: addr.address1 || '', address2: addr.address2 || '', city: addr.city || '', postal_code: addr.postal_code || '', region: addr.region || '', country: addr.country || 'France', phone: addr.phone || '', email: addr.email || '', is_default: addr.is_default || false });
    setFeedback(''); setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette adresse ?')) return;
    try {
      await apiClient.delete(`/pg/auth/addresses/${id}`);
      setFeedback('Adresse supprimée.');
      load();
    } catch (e) { setFeedback(`Erreur : ${e.message}`); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.address1 || !form.city) { setFeedback('Adresse et ville obligatoires.'); return; }
    try {
      if (editingId) {
        await apiClient.put(`/pg/auth/addresses/${editingId}`, form);
        setFeedback('Adresse mise à jour.');
      } else {
        await apiClient.post('/pg/auth/addresses', form);
        setFeedback('Adresse ajoutée.');
      }
      setShowForm(false);
      load();
    } catch (err) { setFeedback(`Erreur : ${err.message}`); }
  };

  const f = (field, placeholder, required = false) => (
    <input className="input" placeholder={placeholder + (required ? ' *' : '')} value={form[field] || ''} onChange={(e) => setForm({ ...form, [field]: e.target.value })} />
  );

  return (
    <section className="page">
      <header className="page__header">
        <h1 className="page__title">Mes adresses</h1>
        <p className="page__subtitle">Gérez vos adresses de livraison et de facturation.</p>
      </header>

      {feedback && <div className="notice notice--info">{feedback}</div>}
      {loading && <div className="notice notice--info">Chargement…</div>}

      <div className="stack">
        {!loading && addresses.length === 0 && (
          <div className="notice notice--info">Aucune adresse enregistrée.</div>
        )}
        {addresses.map((addr) => (
          <article className="panel" key={addr.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <strong>{addr.label || (addr.type === 'billing' ? 'Facturation' : 'Livraison')}</strong>
              {addr.is_default && <span className="status-pill status-pill--ok" style={{ marginLeft: 8 }}>Par défaut</span>}
              <p>{addr.first_name} {addr.last_name}</p>
              <p>{addr.address1}{addr.address2 ? `, ${addr.address2}` : ''}</p>
              <p>{addr.postal_code} {addr.city}{addr.region ? `, ${addr.region}` : ''}</p>
              <p>{addr.country}</p>
              {addr.phone && <p>Tél. : {addr.phone}</p>}
            </div>
            <div className="inline-actions">
              <button type="button" className="btn btn--secondary" onClick={() => openEdit(addr)}>✏️ Modifier</button>
              <button type="button" className="btn btn--secondary" style={{ color: 'var(--color-danger, #c0392b)' }} onClick={() => handleDelete(addr.id)}>🗑 Supprimer</button>
            </div>
          </article>
        ))}
      </div>

      {showForm ? (
        <div className="panel stack" style={{ marginTop: 16 }}>
          <h3>{editingId ? 'Modifier l\'adresse' : 'Nouvelle adresse'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              {f('label', 'Libellé (ex: Domicile)')}
              <select className="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="shipping">Livraison</option>
                <option value="billing">Facturation</option>
              </select>
              {f('first_name', 'Prénom')}
              {f('last_name', 'Nom')}
              {f('address1', 'Adresse 1', true)}
              {f('address2', 'Adresse 2 (optionnel)')}
              {f('city', 'Ville', true)}
              {f('postal_code', 'Code postal')}
              {f('region', 'Région')}
              {f('country', 'Pays')}
              {f('phone', 'Téléphone')}
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <input type="checkbox" checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })} />
              Définir comme adresse par défaut
            </label>
            <div className="inline-actions" style={{ marginTop: 12 }}>
              <button type="submit" className="btn btn--primary">{editingId ? 'Enregistrer' : 'Ajouter'}</button>
              <button type="button" className="btn btn--secondary" onClick={() => setShowForm(false)}>Annuler</button>
            </div>
          </form>
        </div>
      ) : (
        <button type="button" className="btn btn--secondary" style={{ marginTop: 16 }} onClick={openCreate}>+ Ajouter une adresse</button>
      )}

      <div className="page-actions">
        <button className="btn btn--secondary" type="button" onClick={() => onNavigate('/account')}>Retour</button>
      </div>
    </section>
  );
}
