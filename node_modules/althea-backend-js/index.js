// --- PRODUITS ---
// Lister tous les produits (admin)
app.get('/api/admin/products', authenticateToken, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ message: 'Accès refusé' });
  try {
    const { rows } = await pool.query('SELECT * FROM product ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// Créer un produit (admin)
app.post('/api/admin/products', authenticateToken, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ message: 'Accès refusé' });
  const { price, stock, image, category_id } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO product (price, stock, image, category_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [price, stock, image, category_id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// Modifier un produit (admin)
app.put('/api/admin/products/:id', authenticateToken, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ message: 'Accès refusé' });
  const { id } = req.params;
  const { price, stock, image, category_id } = req.body;
  try {
    await pool.query(
      'UPDATE product SET price = $1, stock = $2, image = $3, category_id = $4, updated_at = NOW() WHERE id = $5',
      [price, stock, image, category_id, id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// Supprimer un produit (admin)
app.delete('/api/admin/products/:id', authenticateToken, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ message: 'Accès refusé' });
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM product WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// --- COMMANDES ---
// Lister toutes les commandes (admin)
app.get('/api/admin/orders', authenticateToken, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ message: 'Accès refusé' });
  try {
    const { rows } = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// Détail d'une commande (admin)
app.get('/api/admin/orders/:id', authenticateToken, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ message: 'Accès refusé' });
  const { id } = req.params;
  try {
    const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (!rows[0]) return res.status(404).json({ message: 'Commande non trouvée' });
    // Récupérer les items de la commande
    const { rows: items } = await pool.query('SELECT * FROM order_item WHERE order_id = $1', [id]);
    res.json({ ...rows[0], items });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// Modifier le statut d'une commande (admin)
app.put('/api/admin/orders/:id/status', authenticateToken, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ message: 'Accès refusé' });
  const { id } = req.params;
  const { status } = req.body;
  try {
    await pool.query('UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2', [status, id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});
// Backend Express pour authentification avec NeonDB
// npm install express pg bcryptjs jsonwebtoken cors

const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_tlLq49ncrGKX@ep-dark-math-alteasok-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
});

const JWT_SECRET = 'votre_secret_ici'; // À personnaliser et sécuriser


// Middleware pour vérifier le token JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token manquant' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token invalide' });
    req.user = user;
    next();
  });
}

// Endpoint de login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = rows[0];
    if (!user) return res.status(401).json({ message: 'Utilisateur inconnu' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Mot de passe incorrect' });

    const token = jwt.sign({ id: user.id, is_admin: user.is_admin }, JWT_SECRET, { expiresIn: '1d' });
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        last_name: user.last_name,
        first_name: user.first_name,
        role: user.is_admin ? 'admin' : 'customer',
        is_admin: user.is_admin,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// Endpoint pour vérifier le token et récupérer le profil utilisateur
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const user = rows[0];
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    res.json({
      id: user.id,
      email: user.email,
      last_name: user.last_name,
      first_name: user.first_name,
      role: user.is_admin ? 'admin' : 'customer',
      is_admin: user.is_admin,
      created_at: user.created_at,
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// Endpoint pour modifier le profil utilisateur (nom, prénom, email)
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  const { email, last_name, first_name } = req.body;
  try {
    await pool.query(
      'UPDATE users SET email = $1, last_name = $2, first_name = $3 WHERE id = $4',
      [email, last_name, first_name, req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// Endpoint pour lister tous les utilisateurs (admin uniquement)
app.get('/api/admin/users', authenticateToken, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ message: 'Accès refusé' });
  try {
    const { rows } = await pool.query('SELECT id, email, last_name, first_name, is_admin, created_at FROM users ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// Endpoint d'inscription (optionnel)
app.post('/api/auth/register', async (req, res) => {
    const { email, password, last_name, first_name } = req.body;
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    console.log('Tentative inscription:', email, 'Résultat requête:', rows);
    if (rows.length > 0) return res.status(400).json({ message: 'Email déjà utilisé' });
    try {
      const hash = await bcrypt.hash(password, 10);
      const result = await pool.query(
        'INSERT INTO users (email, password, last_name, first_name) VALUES ($1, $2, $3, $4) RETURNING *',
        [email, hash, last_name, first_name]
      );
      const user = result.rows[0];
      const token = jwt.sign({ id: user.id, is_admin: user.is_admin }, JWT_SECRET, { expiresIn: '1d' });
      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          last_name: user.last_name,
          first_name: user.first_name,
          role: user.is_admin ? 'admin' : 'customer',
          is_admin: user.is_admin,
        },
      });
    } catch (err) {
      // Gestion explicite de la contrainte unique (email déjà utilisé)
      if (err.code === '23505') {
        return res.status(400).json({ message: 'Email déjà utilisé (contrainte unique)' });
      }
      res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// Endpoint de logout (stateless, pour frontend)
app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true });
});

// Lancement du serveur
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log('API démarrée sur http://localhost:' + PORT));
