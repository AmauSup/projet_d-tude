import React from ‘react’;
import ‘./Account.css’;

const ACCOUNT_NAV = [
  {
    path: ‘/account/settings’,
    icon: ‘⚙️’,
    title: ‘Paramètres’,
    description: ‘Modifier nom, e-mail et mot de passe’,
  },
  {
    path: ‘/account/addresses’,
    icon: ‘📍’,
    title: ‘Mes adresses’,
    description: ‘Carnet d’adresses de livraison et facturation’,
  },
  {
    path: ‘/account/payments’,
    icon: ‘💳’,
    title: ‘Mes paiements’,
    description: ‘Cartes enregistrées (4 derniers chiffres)’,
  },
  {
    path: ‘/orders’,
    icon: ‘📦’,
    title: ‘Mes commandes’,
    description: ‘Historique, statuts et factures PDF’,
  },
];

export default function Account({ user, session, orders = [], onNavigate }) {
	if (!session.isAuthenticated) {
		return (
			<section className="page account-page">
				<header className="page__header">
					<h1 className="page__title">Mon compte</h1>
					<p className="page__subtitle">Connectez-vous pour accéder à votre profil, vos adresses et vos commandes.</p>
				</header>
				<div className="inline-actions">
					<button className="btn btn--primary" type="button" onClick={() => onNavigate(‘/login’)}>Se connecter</button>
					<button className="btn btn--secondary" type="button" onClick={() => onNavigate(‘/register’)}>Créer un compte</button>
				</div>
			</section>
		);
	}

	return (
		<section className="page account-page">
			<header className="page__header">
				<h1 className="page__title">Mon compte</h1>
				<p className="page__subtitle">
					Bonjour {user.firstName ? `${user.firstName} ${user.lastName}` : user.email} — gérez votre profil, adresses, paiements et commandes.
				</p>
			</header>

			<div className="account-nav-grid">
				{ACCOUNT_NAV.map((item) => (
					<button
						key={item.path}
						type="button"
						className="account-nav-card"
						onClick={() => onNavigate(item.path)}
					>
						<span className="account-nav-card__icon" aria-hidden="true">{item.icon}</span>
						<strong className="account-nav-card__title">{item.title}</strong>
						<p className="account-nav-card__desc helper-text">{item.description}</p>
					</button>
				))}
			</div>

			{orders.length > 0 && (
				<article className="card stack" style={{ marginTop: 24 }}>
					<h3>Dernières commandes</h3>
					<div className="stack">
						{orders.slice(0, 3).map((order) => (
							<div key={order.id} className="panel inline-actions" style={{ justifyContent: ‘space-between’ }}>
								<div>
									<strong>{order.id}</strong>
									<p className="helper-text">{order.createdAt} — {order.status}</p>
								</div>
								<span className="status-pill status-pill--warning">{order.status}</span>
							</div>
						))}
					</div>
					<div className="page-actions" style={{ justifyContent: ‘flex-start’ }}>
						<button className="btn btn--secondary" type="button" onClick={() => onNavigate(‘/orders’)}>
							Voir tout l’historique
						</button>
					</div>
				</article>
			)}
		</section>
	);
}
