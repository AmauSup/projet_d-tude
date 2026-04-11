const wait = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));

export const productService = {
  async list(products) {
    await wait();
    // Backend hook: GET /products
    return products;
  },
  async getBySlug(products, slug) {
    await wait();
    // Backend hook: GET /products/:slug
    return products.find((product) => product.slug === slug) ?? null;
  },
};
