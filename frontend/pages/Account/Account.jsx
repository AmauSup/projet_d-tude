import React from 'react';
import PropTypes from 'prop-types';
import './Account.css';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import { useI18n } from '../../contexts/I18nContext.jsx';

Account.propTypes = {
  user: PropTypes.shape({
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    email: PropTypes.string,
  }).isRequired,
  session: PropTypes.shape({ isAuthenticated: PropTypes.bool }).isRequired,
  orders: PropTypes.array,
  onNavigate: PropTypes.func.isRequired,
};

export default function Account({ user, session, orders = [], onNavigate }) {
  const { isDark, toggleTheme } = useTheme();
  const { t } = useI18n();

  const ACCOUNT_NAV = [
    {
      path: '/account/settings',
      icon: '⚙️',
      title: t('account.settingsTitle'),
      description: t('account.settingsDesc'),
    },
    {
      path: '/account/addresses',
      icon: '📍',
      title: t('account.addressesTitle'),
      description: t('account.addressesDesc'),
    },
    {
      path: '/account/payments',
      icon: '💳',
      title: t('account.paymentsTitle'),
      description: t('account.paymentsDesc'),
    },
    {
      path: '/orders',
      icon: '📦',
      title: t('account.ordersTitle'),
      description: t('account.ordersDesc'),
    },
  ];

	if (!session.isAuthenticated) {
		return (
			<section className="page account-page">
				<header className="page__header">
					<h1 className="page__title">{t('account.title')}</h1>
					<p className="page__subtitle">{t('account.signInSubtitle')}</p>
				</header>
				<div className="inline-actions">
					<button className="btn btn--primary" type="button" onClick={() => onNavigate('/login')}>{t('account.signIn')}</button>
					<button className="btn btn--secondary" type="button" onClick={() => onNavigate('/register')}>{t('account.createAccount')}</button>
				</div>
			</section>
		);
	}

	return (
		<section className="page account-page">
			<header className="page__header">
				<h1 className="page__title">{t('account.title')}</h1>
				<p className="page__subtitle">
					{user.firstName ? `${user.firstName} ${user.lastName}` : user.email} — {t('account.subtitle')}
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

			<button type="button" className="theme-toggle-card" onClick={toggleTheme}>
				<div className="theme-toggle-card__left">
					<span className="theme-toggle-card__icon" aria-hidden="true">{isDark ? '🌙' : '☀️'}</span>
					<div>
						<strong className="theme-toggle-card__title">{t('account.appearance')}</strong>
						<p className="account-nav-card__desc helper-text">
							{isDark ? t('account.darkEnabled') : t('account.lightEnabled')}
						</p>
					</div>
				</div>
				<span className={`theme-pill ${isDark ? 'theme-pill--dark' : 'theme-pill--light'}`}>
					{isDark ? t('account.darkLabel') : t('account.lightLabel')}
				</span>
			</button>

			{orders.length > 0 && (
				<article className="card stack" style={{ marginTop: 24 }}>
					<h3>{t('account.recentOrders')}</h3>
					<div className="stack">
						{orders.slice(0, 3).map((order) => (
							<div key={order.id} className="panel inline-actions" style={{ justifyContent: 'space-between' }}>
								<div>
									<strong>{order.id}</strong>
									<p className="helper-text">{order.createdAt} — {order.status}</p>
								</div>
								<span className="status-pill status-pill--warning">{order.status}</span>
							</div>
						))}
					</div>
					<div className="page-actions" style={{ justifyContent: 'flex-start' }}>
						<button className="btn btn--secondary" type="button" onClick={() => onNavigate('/orders')}>
							{t('account.viewHistory')}
						</button>
					</div>
				</article>
			)}
		</section>
	);
}
