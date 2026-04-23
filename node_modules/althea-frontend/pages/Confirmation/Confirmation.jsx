import React from 'react';
import './Confirmation.css';
import { formatPrice } from '../../utils/storefront.js';

export default function Confirmation({ order, products = [], onNavigate }) {
  if (!order) {
    return (
      <section className="page confirmation-page">
        <header className="page__header">
          <h1 className="page__title">Confirmation de commande</h1>
          <p className="page__subtitle">Aucune commande n’a encore été validée.</p>
        </header>

        <button className="btn btn--primary" type="button" onClick={() => onNavigate('/cart')}>
          Retourner au panier
        </button>
      </section>
    );
  }

  return (
    <section className="page confirmation-page">
      <header className="page__header">
        <h1 className="page__title">Commande confirmée</h1>
        <p className="page__subtitle">
          Votre commande {order.id} a bien été préparée. Un e-mail récapitulatif sera envoyé après branchement backend.
        </p>
      </header>

      <div className="confirmation-layout">
        <article className="card">
          <h3>Récapitulatif</h3>
          <div className="confirmation-list">
            {order.items.map((item) => {
              const product = products.find((candidate) => candidate.id === item.productId);
              if (!product) {
                return null;
              }

              return (
                <div key={item.productId} className="confirmation-line">
                  <span>
                    {product.name} × {item.quantity}
                  </span>
                  <strong>{formatPrice(product.priceCents * item.quantity)}</strong>
                </div>
              );
            })}
          </div>
          <div className="confirmation-line confirmation-line--total">
            <span>Total payé</span>
            <strong>{formatPrice(order.totalCents)}</strong>
          </div>
        </article>

        <article className="card">
          <h3>Adresse de facturation</h3>
          <p>
            {order.billingAddress.firstName} {order.billingAddress.lastName}
            <br />
            {order.billingAddress.address1}
            {order.billingAddress.address2 ? `, ${order.billingAddress.address2}` : ''}
            <br />
            {order.billingAddress.postalCode} {order.billingAddress.city}
            <br />
            {order.billingAddress.region}, {order.billingAddress.country}
          </p>

          <h3>Paiement</h3>
          <p>{order.paymentSummary}</p>
        </article>
      </div>

      <div className="confirmation-actions">
        <button className="btn btn--secondary" type="button" onClick={() => onNavigate('/orders')}>
          Voir mes commandes
        </button>
        <button className="btn btn--primary" type="button" onClick={() => onNavigate('/')}>
          Retour à l’accueil
        </button>
      </div>
    </section>
  );
}
