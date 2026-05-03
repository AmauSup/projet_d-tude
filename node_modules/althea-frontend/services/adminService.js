
// Récupère le token JWT stocké (adapter selon ton projet)
function getToken() {
  return localStorage.getItem('authToken');
}

export const adminService = {
  // Statistiques mockées (à remplacer si besoin)
  async getStats({ products = [], orders = [] } = {}) {
    return {
      products: products.length,
      orders: orders.length,
      revenue: orders.reduce((sum, order) => sum + (order.total_amount || 0), 0),
    };
  },

  // --- PRODUITS ---
  async listProducts() {
    const res = await fetch('http://localhost:3001/api/admin/products', {
      headers: { Authorization: 'Bearer ' + getToken() },
    });
    if (!res.ok) throw new Error('Erreur chargement produits');
    return await res.json();
  },
  async createProduct(product) {
    const res = await fetch('http://localhost:3001/api/admin/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + getToken(),
      },
      body: JSON.stringify(product),
    });
    if (!res.ok) throw new Error('Erreur création produit');
    return await res.json();
  },
  async updateProduct(id, product) {
    const res = await fetch('http://localhost:3001/api/admin/products/' + id, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + getToken(),
      },
      body: JSON.stringify(product),
    });
    if (!res.ok) throw new Error('Erreur modification produit');
    return await res.json();
  },
  async deleteProduct(id) {
    const res = await fetch('http://localhost:3001/api/admin/products/' + id, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer ' + getToken() },
    });
    if (!res.ok) throw new Error('Erreur suppression produit');
    return await res.json();
  },

  // --- COMMANDES ---
  async listOrders() {
    const res = await fetch('http://localhost:3001/api/admin/orders', {
      headers: { Authorization: 'Bearer ' + getToken() },
    });
    if (!res.ok) throw new Error('Erreur chargement commandes');
    return await res.json();
  },
  async getOrder(id) {
    const res = await fetch('http://localhost:3001/api/admin/orders/' + id, {
      headers: { Authorization: 'Bearer ' + getToken() },
    });
    if (!res.ok) throw new Error('Erreur chargement commande');
    return await res.json();
  },
  async updateOrderStatus(id, status) {
    const res = await fetch('http://localhost:3001/api/admin/orders/' + id + '/status', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + getToken(),
      },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Erreur maj statut commande');
    return await res.json();
  },
};
