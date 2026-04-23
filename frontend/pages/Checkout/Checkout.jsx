import React, { useMemo, useState } from 'react';
import './Checkout.css';
import { formatPrice } from '../../utils/storefront.js';

function buildInitialAddress(user) {
<<<<<<< HEAD
  const savedAddress = user.addresses?.[0];
  return (
    savedAddress || {
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      address1: '',
      address2: '',
      city: '',
      region: '',
      postalCode: '',
      country: 'France',
      phone: user.phone || '',
      email: user.email || '',
    }
  );
}

function buildInitialPayment(user) {
  const savedPayment = user.paymentMethods?.[0];
  return (
    savedPayment
      ? {
          cardholderName: savedPayment.cardholderName,
          cardNumber: `000000000000${savedPayment.last4}`,
          expiry: savedPayment.expiry,
          cvv: '',
        }
      : {
          cardholderName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          cardNumber: '',
          expiry: '',
          cvv: '',
        }
  );
}

export default function Checkout({ cartItems = [], summary, user, session, onNavigate, onPlaceOrder }) {
  const [step, setStep] = useState(session.isAuthenticated ? 2 : 1);
  const [guestMode, setGuestMode] = useState(!session.isAuthenticated);
  const [address, setAddress] = useState(buildInitialAddress(user));
  const [payment, setPayment] = useState(buildInitialPayment(user));
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cartIsReady = useMemo(() => cartItems.length > 0 && summary.unavailableCount === 0, [cartItems.length, summary.unavailableCount]);

  const nextStep = () => {
    if (step === 1) {
      setStep(2);
      return;
    }

    if (step === 2) {
      const requiredAddressFields = ['firstName', 'lastName', 'address1', 'city', 'region', 'postalCode', 'country', 'phone'];
      const isValid = requiredAddressFields.every((field) => address[field]);

      if (!isValid) {
        setFeedback('Merci de completer toutes les informations de facturation obligatoires.');
        return;
      }

      setFeedback('');
      setStep(3);
      return;
    }

    const requiredPaymentFields = ['cardholderName', 'cardNumber', 'expiry', 'cvv'];
    const isValid = requiredPaymentFields.every((field) => payment[field]);

    if (!isValid) {
      setFeedback('Merci de completer les informations de paiement.');
      return;
    }

    setFeedback('');
    setStep(4);
  };

  const handlePlaceOrder = async () => {
    setIsSubmitting(true);
    const result = await onPlaceOrder({ billingAddress: address, paymentDetails: payment });
    setFeedback(result.message);
    setIsSubmitting(false);
  };

  return (
    <section className="page checkout-page">
      <header className="page__header">
        <h1 className="page__title">Passage en caisse</h1>
        <p className="page__subtitle">Tunnel pret pour un paiement securise, une creation de commande backend et l envoi d un e-mail de confirmation.</p>
      </header>

      <div className="checkout-steps">
        <span className={`checkout-step ${step === 1 ? 'is-active' : ''}`}>1. Compte / invite</span>
        <span className={`checkout-step ${step === 2 ? 'is-active' : ''}`}>2. Facturation</span>
        <span className={`checkout-step ${step === 3 ? 'is-active' : ''}`}>3. Paiement</span>
        <span className={`checkout-step ${step === 4 ? 'is-active' : ''}`}>4. Confirmation</span>
      </div>

      {cartItems.length === 0 ? <div className="notice notice--warning">Votre panier est vide. Ajoutez des produits avant de passer au checkout.</div> : null}
      {summary.unavailableCount > 0 ? <div className="notice notice--warning">Des produits sont indisponibles dans votre panier. Le checkout reste bloque tant qu ils ne sont pas retires.</div> : null}
      {feedback ? <div className={`notice ${feedback.toLowerCase().includes('validee') ? 'notice--success' : 'notice--warning'}`}>{feedback}</div> : null}

      {step === 1 ? (
        <div className="panel stack">
          <h3>Identification</h3>
          {session.isAuthenticated ? (
            <div className="notice notice--success">Connecte en tant que {user.email}. Vous pouvez poursuivre le checkout.</div>
          ) : (
            <>
              <p>Vous pouvez vous connecter, creer un compte ou continuer en tant qu invite.</p>
              <div className="inline-actions">
                <button className="btn btn--secondary" type="button" onClick={() => onNavigate('/login')}>Se connecter</button>
                <button className="btn btn--secondary" type="button" onClick={() => onNavigate('/register')}>Creer un compte</button>
              </div>
              <label><input type="checkbox" checked={guestMode} onChange={(event) => setGuestMode(event.target.checked)} /> Continuer en tant qu invite</label>
            </>
          )}
        </div>
      ) : null}

      {step === 2 ? (
        <div className="stack">
          <div className="inline-actions">
            {user.addresses?.length ? (
              <button className="btn btn--secondary" type="button" onClick={() => setAddress(buildInitialAddress(user))}>
                Utiliser l adresse enregistree
              </button>
            ) : null}
          </div>
          <div className="form-grid">
            <input className="input" placeholder="Prenom" value={address.firstName} onChange={(event) => setAddress({ ...address, firstName: event.target.value })} />
            <input className="input" placeholder="Nom" value={address.lastName} onChange={(event) => setAddress({ ...address, lastName: event.target.value })} />
            <input className="input" placeholder="Email" value={address.email || ''} onChange={(event) => setAddress({ ...address, email: event.target.value })} />
            <input className="input" placeholder="Adresse 1" value={address.address1} onChange={(event) => setAddress({ ...address, address1: event.target.value })} />
            <input className="input" placeholder="Adresse 2 (optionnel)" value={address.address2 || ''} onChange={(event) => setAddress({ ...address, address2: event.target.value })} />
            <input className="input" placeholder="Ville" value={address.city} onChange={(event) => setAddress({ ...address, city: event.target.value })} />
            <input className="input" placeholder="Region" value={address.region} onChange={(event) => setAddress({ ...address, region: event.target.value })} />
            <input className="input" placeholder="Code postal" value={address.postalCode} onChange={(event) => setAddress({ ...address, postalCode: event.target.value })} />
            <input className="input" placeholder="Pays" value={address.country} onChange={(event) => setAddress({ ...address, country: event.target.value })} />
            <input className="input" placeholder="Telephone mobile" value={address.phone} onChange={(event) => setAddress({ ...address, phone: event.target.value })} />
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="checkout-layout">
          <div className="stack">
            <div className="inline-actions">
              {user.paymentMethods?.length ? (
                <button className="btn btn--secondary" type="button" onClick={() => setPayment(buildInitialPayment(user))}>
                  Utiliser le moyen enregistre
                </button>
              ) : null}
            </div>
            <div className="form-grid">
              <input className="input" placeholder="Nom sur la carte" value={payment.cardholderName} onChange={(event) => setPayment({ ...payment, cardholderName: event.target.value })} />
              <input className="input" placeholder="Numero de carte" value={payment.cardNumber} onChange={(event) => setPayment({ ...payment, cardNumber: event.target.value })} />
              <input className="input" placeholder="Date d expiration (MM/AA)" value={payment.expiry} onChange={(event) => setPayment({ ...payment, expiry: event.target.value })} />
              <input className="input" placeholder="CVV" value={payment.cvv} onChange={(event) => setPayment({ ...payment, cvv: event.target.value })} />
            </div>
            <div className="notice notice--info">Pret pour integration Stripe/PayPal cote backend avec tokenisation securisee.</div>
          </div>

          <aside className="cart-summary">
            <h3>Recapitulatif</h3>
            {cartItems.map((item) => (
              <p key={item.productId}>{item.product.name} x {item.quantity} - {formatPrice(item.lineTotalCents)}</p>
            ))}
            <hr />
            <p>Sous-total : {formatPrice(summary.subtotalCents)}</p>
            <p>Taxes : {formatPrice(summary.taxCents)}</p>
            <p>Promotion : -{formatPrice(summary.promotionCents)}</p>
            <p><strong>Total : {formatPrice(summary.totalCents)}</strong></p>
          </aside>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="stack">
          <h3>Recapitulatif de votre commande</h3>

          <article className="panel stack">
            <h4>Produits commandes</h4>
            {cartItems.map((item) => (
              <div key={item.productId} className="inline-actions">
                <span><strong>{item.product.name}</strong> x {item.quantity}</span>
                <span>{formatPrice(item.lineTotalCents)}</span>
              </div>
            ))}
            <hr />
            <p>Sous-total : {formatPrice(summary.subtotalCents)}</p>
            <p>Taxes : {formatPrice(summary.taxCents)}</p>
            <p>Promotion : -{formatPrice(summary.promotionCents)}</p>
            <p><strong>Total TTC : {formatPrice(summary.totalCents)}</strong></p>
          </article>

          <article className="panel stack">
            <h4>Adresse de facturation</h4>
            <p>{address.firstName} {address.lastName}</p>
            <p>{address.address1}{address.address2 ? `, ${address.address2}` : ''}</p>
            <p>{address.postalCode} {address.city} - {address.region}</p>
            <p>{address.country}</p>
            <p>Tel. : {address.phone}</p>
          </article>

          <article className="panel">
            <h4>Paiement</h4>
            <p>{payment.cardholderName} - •••• •••• •••• {payment.cardNumber.slice(-4)}</p>
            <p>Exp. : {payment.expiry}</p>
          </article>
        </div>
      ) : null}

      <div className="checkout-actions">
        <button type="button" className="btn btn--secondary" onClick={() => (step === 1 ? onNavigate('/cart') : setStep(step - 1))}>Retour</button>
        {step < 4 ? (
          <button type="button" className="btn btn--primary" disabled={!cartIsReady || (!session.isAuthenticated && !guestMode)} onClick={nextStep}>
            Continuer
          </button>
        ) : (
          <button type="button" className="btn btn--primary" disabled={!cartIsReady || isSubmitting} onClick={handlePlaceOrder}>
            {isSubmitting ? 'Validation...' : "Confirmer l'achat"}
          </button>
        )}
      </div>
    </section>
  );
=======
	const savedAddress = user.addresses?.[0];
	return (
		savedAddress || {
			firstName: user.firstName || '',
			lastName: user.lastName || '',
			address1: '',
			address2: '',
			city: '',
			region: '',
			postalCode: '',
			country: 'France',
			phone: user.phone || '',
			email: user.email || '',
		}
	);
}

function buildInitialPayment(user) {
	const savedPayment = user.paymentMethods?.[0];
	return (
		savedPayment
			? {
				cardholderName: savedPayment.cardholderName,
				cardNumber: `000000000000${savedPayment.last4}`,
				expiry: savedPayment.expiry,
				cvv: '',
			}
			: {
				cardholderName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
				cardNumber: '',
				expiry: '',
				cvv: '',
			}
	);
}

export default function Checkout({ cartItems = [], summary, user, session, onNavigate, onPlaceOrder }) {
	const [step, setStep] = useState(session.isAuthenticated ? 2 : 1);
	const [guestMode, setGuestMode] = useState(!session.isAuthenticated);
	const [address, setAddress] = useState(buildInitialAddress(user));
	const [payment, setPayment] = useState(buildInitialPayment(user));
	const [feedback, setFeedback] = useState('');

	const cartIsReady = useMemo(() => cartItems.length > 0 && summary.unavailableCount === 0, [cartItems.length, summary.unavailableCount]);

	const nextStep = () => {
		if (step === 1) {
			setStep(2);
			return;
		}

		if (step === 2) {
			const requiredAddressFields = ['firstName', 'lastName', 'address1', 'city', 'region', 'postalCode', 'country', 'phone'];
			const isValid = requiredAddressFields.every((field) => address[field]);

			if (!isValid) {
				setFeedback('Merci de compléter toutes les informations de facturation obligatoires.');
				return;
			}

			setFeedback('');
			setStep(3);
			return;
		}

		const requiredPaymentFields = ['cardholderName', 'cardNumber', 'expiry', 'cvv'];
		const isValid = requiredPaymentFields.every((field) => payment[field]);

		if (!isValid) {
			setFeedback('Merci de compléter les informations de paiement.');
			return;
		}

		setFeedback('');
		setStep(4);
	};

	const handlePlaceOrder = () => {
		const result = onPlaceOrder({ billingAddress: address, paymentDetails: payment });
		setFeedback(result.message);
	};

	return (
		<section className="page checkout-page">
			<header className="page__header">
				<h1 className="page__title">Passage en caisse</h1>
				<p className="page__subtitle">Tunnel prêt pour un paiement sécurisé, une création de commande backend et l’envoi d’un e-mail de confirmation.</p>
			</header>

			<div className="checkout-steps">
				<span className={`checkout-step ${step === 1 ? 'is-active' : ''}`}>1. Compte / invité</span>
				<span className={`checkout-step ${step === 2 ? 'is-active' : ''}`}>2. Facturation</span>
				<span className={`checkout-step ${step === 3 ? 'is-active' : ''}`}>3. Paiement</span>
				<span className={`checkout-step ${step === 4 ? 'is-active' : ''}`}>4. Confirmation</span>
			</div>

			{cartItems.length === 0 ? <div className="notice notice--warning">Votre panier est vide. Ajoutez des produits avant de passer au checkout.</div> : null}
			{summary.unavailableCount > 0 ? <div className="notice notice--warning">Des produits sont indisponibles dans votre panier. Le checkout reste bloqué tant qu’ils ne sont pas retirés.</div> : null}
			{feedback ? <div className={`notice ${feedback.includes('validée') ? 'notice--success' : 'notice--warning'}`}>{feedback}</div> : null}

			{step === 1 ? (
				<div className="panel stack">
					<h3>Identification</h3>
					{session.isAuthenticated ? (
						<div className="notice notice--success">Connecté en tant que {user.email}. Vous pouvez poursuivre le checkout.</div>
					) : (
						<>
							<p>Vous pouvez vous connecter, créer un compte ou continuer en tant qu’invité.</p>
							<div className="inline-actions">
								<button className="btn btn--secondary" type="button" onClick={() => onNavigate('/login')}>Se connecter</button>
								<button className="btn btn--secondary" type="button" onClick={() => onNavigate('/register')}>Créer un compte</button>
							</div>
							<label><input type="checkbox" checked={guestMode} onChange={(event) => setGuestMode(event.target.checked)} /> Continuer en tant qu’invité</label>
						</>
					)}
				</div>
			) : null}

			{step === 2 ? (
				<div className="stack">
					<div className="inline-actions">
						{user.addresses?.length ? (
							<button className="btn btn--secondary" type="button" onClick={() => setAddress(buildInitialAddress(user))}>
								Utiliser l’adresse enregistrée
							</button>
						) : null}
					</div>
					<div className="form-grid">
						<input className="input" placeholder="Prénom" value={address.firstName} onChange={(event) => setAddress({ ...address, firstName: event.target.value })} />
						<input className="input" placeholder="Nom" value={address.lastName} onChange={(event) => setAddress({ ...address, lastName: event.target.value })} />
						<input className="input" placeholder="Email" value={address.email || ''} onChange={(event) => setAddress({ ...address, email: event.target.value })} />
						<input className="input" placeholder="Adresse 1" value={address.address1} onChange={(event) => setAddress({ ...address, address1: event.target.value })} />
						<input className="input" placeholder="Adresse 2 (optionnel)" value={address.address2 || ''} onChange={(event) => setAddress({ ...address, address2: event.target.value })} />
						<input className="input" placeholder="Ville" value={address.city} onChange={(event) => setAddress({ ...address, city: event.target.value })} />
						<input className="input" placeholder="Région" value={address.region} onChange={(event) => setAddress({ ...address, region: event.target.value })} />
						<input className="input" placeholder="Code postal" value={address.postalCode} onChange={(event) => setAddress({ ...address, postalCode: event.target.value })} />
						<input className="input" placeholder="Pays" value={address.country} onChange={(event) => setAddress({ ...address, country: event.target.value })} />
						<input className="input" placeholder="Téléphone mobile" value={address.phone} onChange={(event) => setAddress({ ...address, phone: event.target.value })} />
					</div>
				</div>
			) : null}

			{step === 3 ? (
				<div className="checkout-layout">
					<div className="stack">
						<div className="inline-actions">
							{user.paymentMethods?.length ? (
								<button className="btn btn--secondary" type="button" onClick={() => setPayment(buildInitialPayment(user))}>
									Utiliser le moyen enregistré
								</button>
							) : null}
						</div>
						<div className="form-grid">
							<input className="input" placeholder="Nom sur la carte" value={payment.cardholderName} onChange={(event) => setPayment({ ...payment, cardholderName: event.target.value })} />
							<input className="input" placeholder="Numéro de carte" value={payment.cardNumber} onChange={(event) => setPayment({ ...payment, cardNumber: event.target.value })} />
							<input className="input" placeholder="Date d'expiration (MM/AA)" value={payment.expiry} onChange={(event) => setPayment({ ...payment, expiry: event.target.value })} />
							<input className="input" placeholder="CVV" value={payment.cvv} onChange={(event) => setPayment({ ...payment, cvv: event.target.value })} />
						</div>
						<div className="notice notice--info">Prévu pour intégration Stripe/PayPal côté backend avec tokenisation sécurisée.</div>
					</div>

					<aside className="cart-summary">
						<h3>Récapitulatif</h3>
						{cartItems.map((item) => (
							<p key={item.productId}>{item.product.name} × {item.quantity} — {formatPrice(item.lineTotalCents)}</p>
						))}
						<hr />
						<p>Sous-total : {formatPrice(summary.subtotalCents)}</p>
						<p>Taxes : {formatPrice(summary.taxCents)}</p>
						<p>Promotion : -{formatPrice(summary.promotionCents)}</p>
						<p><strong>Total : {formatPrice(summary.totalCents)}</strong></p>
					</aside>
				</div>
			) : null}

			{step === 4 ? (
				<div className="stack">
					<h3>Récapitulatif de votre commande</h3>

					<article className="panel stack">
						<h4>Produits commandés</h4>
						{cartItems.map((item) => (
							<div key={item.productId} className="inline-actions">
								<span><strong>{item.product.name}</strong> × {item.quantity}</span>
								<span>{formatPrice(item.lineTotalCents)}</span>
							</div>
						))}
						<hr />
						<p>Sous-total : {formatPrice(summary.subtotalCents)}</p>
						<p>Taxes : {formatPrice(summary.taxCents)}</p>
						<p>Promotion : -{formatPrice(summary.promotionCents)}</p>
						<p><strong>Total TTC : {formatPrice(summary.totalCents)}</strong></p>
					</article>

					<article className="panel stack">
						<h4>Adresse de facturation</h4>
						<p>{address.firstName} {address.lastName}</p>
						<p>{address.address1}{address.address2 ? `, ${address.address2}` : ''}</p>
						<p>{address.postalCode} {address.city} — {address.region}</p>
						<p>{address.country}</p>
						<p>Tél. : {address.phone}</p>
					</article>

					<article className="panel">
						<h4>Paiement</h4>
						<p>{payment.cardholderName} — •••• •••• •••• {payment.cardNumber.slice(-4)}</p>
						<p>Exp. : {payment.expiry}</p>
					</article>
				</div>
			) : null}

			<div className="checkout-actions">
				<button type="button" className="btn btn--secondary" onClick={() => (step === 1 ? onNavigate('/cart') : setStep(step - 1))}>Retour</button>
				{step < 4 ? (
					<button type="button" className="btn btn--primary" disabled={!cartIsReady || (!session.isAuthenticated && !guestMode)} onClick={nextStep}>
						Continuer
					</button>
				) : (
					<button type="button" className="btn btn--primary" disabled={!cartIsReady} onClick={handlePlaceOrder}>
						Confirmer l'achat
					</button>
				)}
			</div>
		</section>
	);
>>>>>>> origin/main
}
