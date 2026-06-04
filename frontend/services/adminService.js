const wait = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));

const USERS_KEY = 'althea-admin-users';

const defaultUsers = [
  {
    id: 1,
    first_name: 'Admin',
    last_name: 'Althea',
    email: 'admin@test.fr',
    is_admin: true,
    created_at: '2026-03-01',
    disabled: false,
  },
  {
    id: 2,
    first_name: 'Lina',
    last_name: 'Martin',
    email: 'lina.martin@cabinet-demo.fr',
    is_admin: false,
    created_at: '2026-03-07',
    disabled: false,
  },
];

function readUsers() {
  const saved = localStorage.getItem(USERS_KEY);
  if (!saved) {
    localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
    return defaultUsers;
  }

  return JSON.parse(saved);
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export const adminService = {
  async getStats({ products, orders }) {
    await wait();
    return {
      products: products.length,
      orders: orders.length,
      revenue: orders.reduce((sum, order) => sum + order.totalCents, 0),
    };
  },

  async listUsers() {
    await wait();
    return readUsers().filter((user) => !user.disabled);
  },

  async createUser(user) {
    await wait();

    const users = readUsers();
    const nextUser = {
      id: Date.now(),
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      is_admin: user.is_admin,
      created_at: new Date().toISOString(),
      disabled: false,
    };

    saveUsers([nextUser, ...users]);
    return nextUser;
  },

  async deleteUser(id) {
    await wait();

    const users = readUsers().map((user) =>
      user.id === id ? { ...user, disabled: true } : user
    );

    saveUsers(users);
    return true;
  },
};