const wait = (ms = 160) => new Promise((resolve) => setTimeout(resolve, ms));

export const checkoutService = {
  async validateBeforePayment({ hasUnavailableItems, hasItems }) {
    await wait();
    if (hasUnavailableItems) {
      return { valid: false, message: 'Retirez les produits indisponibles.' };
    }
    if (!hasItems) {
      return { valid: false, message: 'Panier vide.' };
    }
    return { valid: true };
  },
  async createPaymentIntent() {
    await wait();
    // Backend hook: integrate Stripe/PayPal payment intent
    return { clientSecret: 'mock-client-secret' };
  },
};
