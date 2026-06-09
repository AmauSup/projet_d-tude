import { apiClient } from './apiClient.js';

export const checkoutService = {
  validateBeforePayment({ hasUnavailableItems, hasItems }) {
    if (hasUnavailableItems) return { valid: false, message: 'Retirez les produits indisponibles.' };
    if (!hasItems) return { valid: false, message: 'Panier vide.' };
    return { valid: true };
  },

  async placeOrder({ items, billingAddress, paymentDetails }) {
    const payload = {
      items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
      billingAddress,
      paymentDetails,
    };
    const data = await apiClient.post('/pg/orders', payload);
    return data.order;
  },
};
