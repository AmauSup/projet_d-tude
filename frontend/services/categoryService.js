const wait = (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms));

export const categoryService = {
  async list(categories) {
    await wait();
    // Backend hook: GET /categories
    return categories;
  },
};
