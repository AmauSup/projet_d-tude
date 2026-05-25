import React, { useMemo, useState } from 'react';
import './Checkout.css';
import { formatPrice } from '../../utils/storefront.js';

function buildInitialAddress(user) {
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
  const [billingAddress, setBillingAddress] = useState(buildInitialAddress(user));
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [shippingAddress, setShippingAddress] = useState(buildInitialAddress(user));
  const [payment, setPayment] = useState(buildInitialPayment(user));
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const cartIsReady = useMemo(() => cartItems.length > 0 && summary.unavailableCount === 0, [cartItems.length, summary.unavailableCount]);

  const nextStep = () => {
    if (step === 1) {
      setStep(2);
      return;
    }

    if (step === 2) {
      const requiredAddressFields = ['firstName', 'lastName', 'address1', 'city', 'region', 'postalCode', 'country', 'phone'];
      const isValid = requiredAddressFields.every((field) => billingAddress[field]);
      if (!isValid) {
        setFeedback('Merci de compléter toutes les informations de facturation obligatoires.');
        return;
      }
      if (!sameAsShipping) {
        const isShippingValid = requiredAddressFields.every((field) => shippingAddress[field]);
        if (!isShippingValid) {
          setFeedback('Merci de compléter toutes les informations de livraison obligatoires.');
          return;
        }
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

  const handlePlaceOrder = async () => {
    if (submitting) return;
    setSubmitting(true);
    const deliveryAddress = sameAsShipping ? billingAddress : shippingAddress;
    const result = await onPlaceOrder({ billingAddress, shippingAddress: deliveryAddress, paymentDetails: payment });
    setFeedback(result.message);
    setSubmitting(false);
  };

  const billingField = (field, placeholder, required = false) => (
    <input
      className="input"
      placeholder={placeholder + (required ? ' *' : '')}
      value={billingAddress[field] || ''}
      onChange={(e) => setBillingAddress({ ...billingAddress, [field]: e.target.value })}
    />
  );

  const shippingField = (field, placeholder, required = false) => (
    <input
      className="input"
      placeholder={placeholder + (required ? ' *' : '')}
      value={shippingAddress[field] || ''}
      onChange={(e) => setShippingAddress({ ...shippingAddress, [field]: e.target.value })}
    />
  );

  return (
    <section className="page checkout-page">
      <header className="page__header">
        <h1 className="page__title">Passage en caisse</h1>
        <p className="page__subtitle">Tunnel prêt pour un paiement sécurisé, une création de commande backend et l'envoi d'un e-mail de confirmation.</p>
      </header>

      <div className="checkout-steps">
        <span className={`checkout-step ${step === 1 ? 'is-active' : ''}`}>1. Compte / invité</span>
        <span className={`checkout-step ${step === 2 ? 'is-active' : ''}`}>2. Adresses</span>
        <span className={`checkout-step ${step === 3 ? 'is-active' : ''}`}>3. Paiement</span>
        <span className={`checkout-step ${step === 4 ? 'is-active' : ''}`}>4. Confirmation</span>
      </div>

      {cartItems.length === 0 ? <div className="notice notice--warning">Votre panier est vide. Ajoutez des produits avant de passer au checkout.</div> : null}
      {summary.unavailableCount > 0 ? <div className="notice notice--warning">Des produits sont indisponibles dans votre panier. Le checkout reste bloqué tant qu'ils ne sont pas retirés.</div> : null}
      {feedback ? <div className={`notice ${feedback.includes('validée') ? 'notice--success' : 'notice--warning'}`}>{feedback}</div> : null}

      {step === 1 ? (
        <div className="panel stack">
          <h3>Identification</h3>
          {session.isAuthenticated ? (
            <div className="notice notice--success">Connecté en tant que {user.email}. Vous pouvez poursuivre le checkout.</div>
          ) : (
            <>
              <p>Vous pouvez vous connecter, créer un compte ou continuer en tant qu'invité.</p>
              <div className="inline-actions">
                <button className="btn btn--secondary" type="button" onClick={() => onNavigate('/login')}>Se connecter</button>
                <button className="btn btn--secondary" type="button" onClick={() => onNavigate('/register')}>Créer un compte</button>
              </div>
              <label><input type="checkbox" checked={guestMode} onChange={(e) => setGuestMode(e.target.checked)} /> Continuer en tant qu'invité</label>
            </>
          )}
        </div>
      ) : null}

      {step === 2 ? (
        <div className="stack">
          <h3>Adresse de facturation</h3>
          <div className="inline-actions">
            {user.addresses?.length ? (
              <button className="btn btn--secondary" type="button" onClick={() => setBillingAddress(buildInitialAddress(user))}>
                Utiliser l'adresse enregistrée
              </button>
            ) : null}
          </div>
          <div className="form-grid">
            {billingField('firstName', 'Prénom', true)}
            {billingField('lastName', 'Nom', true)}
            {billingField('email', 'Email')}
            {billingField('address1', 'Adresse 1', true)}
            {billingField('address2', 'Adresse 2 (optionnel)')}
            {billingField('city', 'Ville', true)}
            {billingField('region', 'Région', true)}
            {billingField('postalCode', 'Code postal', true)}
            {billingField('country', 'Pays', true)}
            {billingField('phone', 'Téléphone mobile', true)}
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
            <input type="checkbox" checked={sameAsShipping} onChange={(e) => setSameAsShipping(e.target.checked)} />
            Adresse de livraison identique à la facturation
          </label>

          {!sameAsShipping && (
            <>
              <h3 style={{ marginTop: 16 }}>Adresse de livraison</h3>
              <div className="form-grid">
                {shippingField('firstName', 'Prénom', true)}
                {shippingField('lastName', 'Nom', true)}
                {shippingField('address1', 'Adresse 1', true)}
                {shippingField('address2', 'Adresse 2 (optionnel)')}
                {shippingField('city', 'Ville', true)}
                {shippingField('region', 'Région', true)}
                {shippingField('postalCode', 'Code postal', true)}
                {shippingField('country', 'Pays', true)}
                {shippingField('phone', 'Téléphone mobile', true)}
              </div>
            </>
          )}
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
              <input className="input" placeholder="Nom sur la carte" value={payment.cardholderName} onChange={(e) => setPayment({ ...payment, cardholderName: e.target.value })} />
              <input className="input" placeholder="Numéro de carte" value={payment.cardNumber} onChange={(e) => setPayment({ ...payment, cardNumber: e.target.value })} />
              <input className="input" placeholder="Date d'expiration (MM/AA)" value={payment.expiry} onChange={(e) => setPayment({ ...payment, expiry: e.target.value })} />
              <input className="input" placeholder="CVV" value={payment.cvv} onChange={(e) => setPayment({ ...payment, cvv: e.target.value })} />
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
            <p>{billingAddress.firstName} {billingAddress.lastName}</p>
            <p>{billingAddress.address1}{billingAddress.address2 ? `, ${billingAddress.address2}` : ''}</p>
            <p>{billingAddress.postalCode} {billingAddress.city} — {billingAddress.region}</p>
            <p>{billingAddress.country}</p>
            <p>Tél. : {billingAddress.phone}</p>
          </article>

          {!sameAsShipping && (
            <article className="panel stack">
              <h4>Adresse de livraison</h4>
              <p>{shippingAddress.firstName} {shippingAddress.lastName}</p>
              <p>{shippingAddress.address1}{shippingAddress.address2 ? `, ${shippingAddress.address2}` : ''}</p>
              <p>{shippingAddress.postalCode} {shippingAddress.city} — {shippingAddress.region}</p>
              <p>{shippingAddress.country}</p>
              <p>Tél. : {shippingAddress.phone}</p>
            </article>
          )}

          <article className="panel">
            <h4>Paiement</h4>
            <p>{payment.cardholderName} — •••• •••• •••• {payment.cardNumber.slice(-4)}</p>
            <p>Exp. : {payment.expiry}</p>
          </article>
        </div>
      ) : null}

      <div className="checkout-actions">
        <button type="button" className="btn btn--secondary" disabled={submitting} onClick={() => (step === 1 ? onNavigate('/cart') : setStep(step - 1))}>Retour</button>
        {step < 4 ? (
          <button type="button" className="btn btn--primary" disabled={!cartIsReady || (!session.isAuthenticated && !guestMode)} onClick={nextStep}>
            Continuer
          </button>
        ) : (
          <button type="button" className="btn btn--primary" disabled={!cartIsReady || submitting} onClick={handlePlaceOrder}>
            {submitting ? 'Traitement…' : 'Confirmer l\'achat'}
          </button>
        )}
      </div>
    </section>
  );
}
