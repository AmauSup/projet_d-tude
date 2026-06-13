import { apiClient } from './apiClient.js';

// Service de passage de commande — gère la validation du panier et la création de commande.
export const checkoutService = {

  // Vérifie que le panier est dans un état valide avant de lancer le paiement.
  // Exécuté côté client, sans appel réseau, pour détecter les erreurs tôt.
  // Paramètres :
  //   hasUnavailableItems (boolean) — true si au moins un produit est en rupture de stock
  //   hasItems            (boolean) — true si le panier contient au moins un article
  // Retourne :
  //   { valid: false, message: string } si le panier est invalide
  //   { valid: true }                   si le panier peut passer au paiement
  validateBeforePayment({ hasUnavailableItems, hasItems }) {
    if (hasUnavailableItems) return { valid: false, message: 'Retirez les produits indisponibles.' };
    if (!hasItems) return { valid: false, message: 'Panier vide.' };
    return { valid: true };
  },

  // Envoie la commande au backend et crée l'enregistrement en base de données.
  // Le paiement est simulé (mode démo) : aucune transaction Stripe réelle n'est effectuée.
  // Paramètres :
  //   items          (array)  — articles du panier
  //     items[].productId  (number) — identifiant du produit
  //     items[].quantity   (number) — quantité commandée
  //   billingAddress (object) — adresse de facturation saisie au checkout
  //   paymentDetails (object) — informations de paiement (numéro de carte fictif en démo)
  // Retourne :
  //   order (object) — commande créée avec son id, son statut et son total
  async placeOrder({ items, billingAddress, paymentDetails }) {
    // Reformatte les items pour n'envoyer que les champs attendus par le backend
    const payload = {
      items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
      billingAddress,
      paymentDetails,
    };
    const data = await apiClient.post('/pg/orders', payload);
    return data.order;
  },
};
