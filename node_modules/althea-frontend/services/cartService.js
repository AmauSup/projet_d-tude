import { buildCartDetails, computeCartSummary } from '../utils/storefront.js';

export const cartService = {
  build(cartItems, products) {
    const details = buildCartDetails(cartItems, products);
    const summary = computeCartSummary(details);
    return { details, summary };
  },
};
