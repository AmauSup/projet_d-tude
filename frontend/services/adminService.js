const wait = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));

export const adminService = {
  async getStats({ products = [], orders = [] } = {}) {
    await wait();
    // Backend hook: GET /admin/stats
    return {
      products: products.length,
      orders: orders.length,
      revenue: orders.reduce((sum, order) => sum + order.totalCents, 0),
    };
  },
};
