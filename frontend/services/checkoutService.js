import { apiClient } from './apiClient.js';

export const checkoutService = {
  validateBeforePayment(payload) {
    return apiClient.post('/checkout/validate', payload);
  },
  createPaymentIntent() {
    return apiClient.post('/checkout/payment-intent', {});
  },
};
