const wait = (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms));

export const orderService = {
  async list(orders) {
    await wait();
    // Backend hook: GET /orders (user scoped)
    return orders;
  },
};
