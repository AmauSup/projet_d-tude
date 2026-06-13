import { apiClient } from '../../frontend/services/apiClient.js';

// Toutes les méthodes de ce service appellent des routes /pg/admin/*.
// Ces routes sont protégées côté backend par les middlewares authenticateToken + requireAdmin.
// Le JWT admin est automatiquement inclus dans chaque requête par apiClient (via buildHeaders),
// donc on n'a pas besoin de le passer manuellement ici.
export const adminService = {
  async getStats(period = '30d') {
    const data = await apiClient.get(`/pg/admin/stats?period=${period}`);
    return data.stats;
  },

  // --- USERS ---
  async listUsers() {
    const data = await apiClient.get('/pg/admin/users');
    return data.users || [];
  },

  async createUser(user) {
    const data = await apiClient.post('/pg/admin/users', user);
    return data.user;
  },

  async updateUser(id, fields) {
    const data = await apiClient.put(`/pg/admin/users/${id}`, fields);
    return data.user;
  },

  // Utilise PATCH (et non DELETE) car c'est un soft-delete :
  // l'utilisateur n'est pas supprimé physiquement de la base, on se contente de renseigner
  // le champ deleted_at avec la date courante. Cela préserve l'historique des commandes
  // et permet une éventuelle restauration du compte.
  async deleteUser(id) {
    await apiClient.patch(`/pg/admin/users/${id}/delete`, {});
    return true;
  },

  // --- ORDERS ---
  async listOrders() {
    const data = await apiClient.get('/pg/admin/orders');
    return data.orders || [];
  },

  async updateOrderStatus(id, status) {
    await apiClient.put(`/pg/admin/orders/${id}/status`, { status });
  },

  // --- PRODUCTS ---
  async listProducts() {
    const data = await apiClient.get('/pg/admin/products');
    return data.products || [];
  },

  async createProduct(fields) {
    const data = await apiClient.post('/pg/admin/products', fields);
    return data.product;
  },

  async updateProduct(id, fields) {
    const data = await apiClient.put(`/pg/admin/products/${id}`, fields);
    return data.product;
  },

  async deleteProduct(id) {
    await apiClient.delete(`/pg/admin/products/${id}`);
    return true;
  },

  // --- CATEGORIES ---
  async listCategories() {
    const data = await apiClient.get('/pg/admin/categories');
    return data.categories || [];
  },

  async createCategory(fields) {
    const data = await apiClient.post('/pg/admin/categories', fields);
    return data.category;
  },

  // Accepte une mise à jour partielle : on peut passer uniquement { order_index: 2 }
  // sans être obligé de renvoyer tous les champs de la catégorie.
  // C'est rendu possible côté backend par un UPDATE SQL qui ne touche que les colonnes transmises.
  async updateCategory(id, fields) {
    await apiClient.put(`/pg/admin/categories/${id}`, fields);
    return true;
  },

  async deleteCategory(id) {
    await apiClient.delete(`/pg/admin/categories/${id}`);
    return true;
  },

  // --- HOMEPAGE / CAROUSEL ---
  async getHomepage() {
    const data = await apiClient.get('/pg/admin/homepage');
    return data.homepage || { fixed_message: '', carousel: [] };
  },

  async updateHomepage(fixed_message) {
    await apiClient.put('/pg/admin/homepage', { fixed_message });
    return true;
  },

  async createCarouselSlide(fields) {
    const data = await apiClient.post('/pg/admin/carousel', fields);
    return data.slide;
  },

  async updateCarouselSlide(id, fields) {
    await apiClient.put(`/pg/admin/carousel/${id}`, fields);
    return true;
  },

  async deleteCarouselSlide(id) {
    await apiClient.delete(`/pg/admin/carousel/${id}`);
    return true;
  },

  // Route PATCH dédiée à la visibilité du carousel (ressource /carousel/:id/visible).
  // Utilise PATCH car on ne met à jour qu'un seul champ de la ressource (visible),
  // contrairement à PUT qui remplace l'intégralité de la ressource.
  async setCarouselSlideVisible(id, visible) {
    await apiClient.patch(`/pg/admin/carousel/${id}/visible`, { visible });
    return true;
  },

  // Pour les catégories, la visibilité passe par le PUT général (même route que updateCategory).
  // Différence intentionnelle avec setCarouselSlideVisible qui a sa propre route PATCH.
  async setCategoryVisible(id, visible) {
    await apiClient.put(`/pg/admin/categories/${id}`, { visible });
    return true;
  },

  // --- SUPPORT MESSAGES ---
  async listContactMessages() {
    const data = await apiClient.get('/pg/admin/messages');
    return data.messages || [];
  },

  // Retourne la réponse complète (pas seulement true) car elle contient le champ `email_sent`
  // (booléen indiquant si l'e-mail de réponse a bien été envoyé à l'utilisateur).
  // Ce champ permet d'afficher un retour visuel précis à l'admin ("e-mail envoyé" ou non).
  async updateMessageStatus(id, status, admin_reply = null) {
    return apiClient.patch(`/pg/admin/messages/${id}`, { status, admin_reply });
  },

  async deleteMessage(id) {
    return apiClient.delete(`/pg/admin/messages/${id}`);
  },

  // --- PAYMENTS / LOGS ---
  async listPayments() {
    const data = await apiClient.get('/pg/admin/payments');
    return data.payments || [];
  },

  async getLogs() {
    const data = await apiClient.get('/pg/admin/logs');
    return data.logs || [];
  },
};
