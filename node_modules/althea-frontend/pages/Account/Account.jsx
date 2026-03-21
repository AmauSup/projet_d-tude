import React, { useState } from 'react';
import './Account.css';

export default function Account({ user, session, orders = [], onSave, onNavigate }) {
	const [form, setForm] = useState({
		firstName: user.firstName || '',
		lastName: user.lastName || '',
		phone: user.phone || '',
		company: user.company || '',
		address1: user.addresses?.[0]?.address1 || '',
		address2: user.addresses?.[0]?.address2 || '',
		postalCode: user.addresses?.[0]?.postalCode || '',
		city: user.addresses?.[0]?.city || '',
		region: user.addresses?.[0]?.region || '',
		country: user.addresses?.[0]?.country || '',
	});

	if (!session.isAuthenticated) {
		return (
			<section className="page account-page">
				<header className="page__header">
					<h1 className="page__title">Mon compte</h1>
					<p className="page__subtitle">Connectez-vous pour accéder à votre profil, vos adresses et vos commandes.</p>
				</header>
				<div className="inline-actions">
					<button className="btn btn--primary" type="button" onClick={() => onNavigate('/login')}>Se connecter</button>
					<button className="btn btn--secondary" type="button" onClick={() => onNavigate('/register')}>Créer un compte</button>
				</div>
			</section>
		);
	}

	return (
		<section className="page account-page">
			<header className="page__header">
				<h1 className="page__title">Mon compte</h1>
				<p className="page__subtitle">Gérez profil, adresses de facturation, moyens de paiement et accès rapide à vos commandes.</p>
			</header>

			<div className="account-sections">
				<article className="card">
					<h3>Profil</h3>
					<div className="form-grid">
						<input className="input" placeholder="Nom" value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} />
						<input className="input" placeholder="Prénom" value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} />
						<input className="input" placeholder="Téléphone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
						<input className="input" placeholder="Société" value={form.company} onChange={(event) => setForm({ ...form, company: event.target.value })} />
					</div>
				</article>

				<article className="card">
					<h3>Adresse de facturation</h3>
					<div className="form-grid">
						<input className="input" placeholder="Adresse 1" value={form.address1} onChange={(event) => setForm({ ...form, address1: event.target.value })} />
						<input className="input" placeholder="Adresse 2 (optionnel)" value={form.address2} onChange={(event) => setForm({ ...form, address2: event.target.value })} />
						<input className="input" placeholder="Code postal" value={form.postalCode} onChange={(event) => setForm({ ...form, postalCode: event.target.value })} />
						<input className="input" placeholder="Ville" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} />
						<input className="input" placeholder="Région" value={form.region} onChange={(event) => setForm({ ...form, region: event.target.value })} />
						<input className="input" placeholder="Pays" value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })} />
					</div>
				</article>

				<article className="card">
					<h3>Moyens de paiement enregistrés</h3>
					<div className="stack">
						{user.paymentMethods?.map((paymentMethod) => (
							<div key={paymentMethod.id} className="panel">
								<strong>{paymentMethod.label}</strong>
								<p className="helper-text">{paymentMethod.cardholderName} •••• {paymentMethod.last4} — exp. {paymentMethod.expiry}</p>
							</div>
						))}
					</div>
				</article>

				<article className="card">
					<h3>Dernières commandes</h3>
					<div className="stack">
						{orders.slice(0, 2).map((order) => (
							<div key={order.id} className="panel">
								<strong>{order.id}</strong>
								<p className="helper-text">{order.status} — {order.createdAt}</p>
							</div>
						))}
					</div>
					<div className="page-actions">
						<button className="btn btn--secondary" type="button" onClick={() => onNavigate('/orders')}>Voir tout l’historique</button>
					</div>
				</article>
			</div>

			<div className="page-actions">
				<button
					className="btn btn--primary"
					type="button"
					onClick={() =>
						onSave({
							firstName: form.firstName,
							lastName: form.lastName,
							phone: form.phone,
							company: form.company,
							addresses: [
								{
									id: user.addresses?.[0]?.id || 'addr-1',
									label: 'Adresse principale',
									firstName: form.firstName,
									lastName: form.lastName,
									address1: form.address1,
									address2: form.address2,
									city: form.city,
									region: form.region,
									postalCode: form.postalCode,
									country: form.country,
									phone: form.phone,
								},
							],
						})
					}
				>
					Enregistrer mes informations
				</button>
			</div>
		</section>
	);
}
