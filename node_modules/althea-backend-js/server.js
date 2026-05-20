'use strict';

require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const routes = require('./routes');

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '2mb' }));
const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  process.env.ADMIN_URL || 'http://localhost:5174',
];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Rate limiting simple (in-memory, sans dépendance supplémentaire)
const rateLimitMap = new Map();
function rateLimit(windowMs, max) {
  return (req, res, next) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const entry = rateLimitMap.get(key) || { count: 0, resetAt: now + windowMs };
    if (now > entry.resetAt) {
      entry.count = 0;
      entry.resetAt = now + windowMs;
    }
    entry.count += 1;
    rateLimitMap.set(key, entry);
    if (entry.count > max) {
      return res.status(429).json({ message: 'Trop de requêtes, veuillez réessayer plus tard.' });
    }
    return next();
  };
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('neon.tech')
    ? { rejectUnauthorized: false }
    : undefined,
});

const JWT_SECRET = process.env.JWT_SECRET || 'althea-dev-secret-change-in-prod';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '1d';

// Expose pool et jwt pour les routes modulaires
app.locals.pool = pool;
app.locals.jwtSecret = JWT_SECRET;
app.locals.jwtExpires = JWT_EXPIRES;

// Middleware JWT partagé
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token manquant' });
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: 'Token invalide ou expiré' });
    req.user = decoded;
    next();
  });
}

// Expose pour les routes modulaires
app.locals.authenticateToken = authenticateToken;

// =====================================================================
// Routes modulaires (routes/ folder — db.json + nouveaux endpoints)
// =====================================================================
app.use('/api', routes);

// =====================================================================
// Routes PostgreSQL directes (auth, produits publics, admin legacy)
// =====================================================================

// --- AUTH ---

// Inscription
app.post('/api/pg/auth/register', rateLimit(15 * 60 * 1000, 20), async (req, res) => {
  const { email, password, last_name, first_name } = req.body;
  if (!email || !password || !last_name || !first_name) {
    return res.status(400).json({ message: 'Tous les champs sont obligatoires.' });
  }
  const passwordValid =
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password);
  if (!passwordValid) {
    return res.status(400).json({
      message: 'Mot de passe trop faible (8+ caractères, majuscule, minuscule, chiffre, spécial).',
    });
  }
  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing.rows.length > 0) return res.status(409).json({ message: 'Email déjà utilisé.' });
    const hash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      'INSERT INTO users (email, password, last_name, first_name) VALUES ($1, $2, $3, $4) RETURNING id, email, last_name, first_name, is_admin',
      [email.toLowerCase().trim(), hash, last_name, first_name],
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, is_admin: user.is_admin }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    return res.status(201).json({
      success: true,
      token,
      user: { id: user.id, email: user.email, last_name: user.last_name, first_name: user.first_name, role: user.is_admin ? 'admin' : 'customer', is_admin: user.is_admin },
    });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ message: 'Email déjà utilisé.' });
    console.error('[register]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Connexion
app.post('/api/pg/auth/login', rateLimit(15 * 60 * 1000, 20), async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email et mot de passe requis.' });
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    const user = rows[0];
    if (!user) return res.status(401).json({ message: 'Identifiants invalides.' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Identifiants invalides.' });
    const token = jwt.sign({ id: user.id, is_admin: user.is_admin }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    return res.json({
      success: true,
      token,
      user: { id: user.id, email: user.email, last_name: user.last_name, first_name: user.first_name, role: user.is_admin ? 'admin' : 'customer', is_admin: user.is_admin },
    });
  } catch (err) {
    console.error('[login]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Profil
app.get('/api/pg/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, email, last_name, first_name, is_admin, created_at FROM users WHERE id = $1',
      [req.user.id],
    );
    const user = rows[0];
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    return res.json({ success: true, user: { ...user, role: user.is_admin ? 'admin' : 'customer' } });
  } catch (err) {
    console.error('[profile]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

app.put('/api/pg/auth/profile', authenticateToken, async (req, res) => {
  const { email, last_name, first_name } = req.body;
  try {
    await pool.query(
      'UPDATE users SET email = $1, last_name = $2, first_name = $3, updated_at = NOW() WHERE id = $4',
      [email, last_name, first_name, req.user.id],
    );
    return res.json({ success: true });
  } catch (err) {
    console.error('[profile update]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// --- PRODUITS PUBLICS ---
app.get('/api/pg/products', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT p.id, p.price, p.stock, p.image, p.category_id, p.created_at, p.updated_at,
             pt.name, pt.description, pt.characteristics,
             c.name AS category_name, c.slug AS category_slug
      FROM product p
      LEFT JOIN product_translation pt ON pt.product_id = p.id
      LEFT JOIN language l ON pt.language_id = l.id AND l.code = 'fr'
      LEFT JOIN category c ON c.id = p.category_id
      WHERE p.deleted_at IS NULL
      ORDER BY p.created_at DESC
    `);
    return res.json({ success: true, products: rows });
  } catch (err) {
    console.error('[products]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// --- STOREFRONT ---
app.get('/api/pg/storefront', async (req, res) => {
  try {
    const [productsRes, categoriesRes] = await Promise.all([
      pool.query(`
        SELECT p.id, p.price, p.stock, p.image, p.category_id, p.created_at,
               pt.name, pt.description, pt.characteristics,
               c.slug AS category_slug
        FROM product p
        LEFT JOIN product_translation pt ON pt.product_id = p.id
        LEFT JOIN language l ON pt.language_id = l.id AND l.code = 'fr'
        LEFT JOIN category c ON c.id = p.category_id
        WHERE p.deleted_at IS NULL
        ORDER BY p.created_at DESC
      `),
      pool.query('SELECT * FROM category ORDER BY order_index ASC, id ASC'),
    ]);

    let homeContent = { fixedMessage: 'Bienvenue sur Althea Systems.', carousel: [] };
    try {
      const hcRes = await pool.query('SELECT * FROM homepage_content ORDER BY id LIMIT 1');
      if (hcRes.rows[0]) homeContent.fixedMessage = hcRes.rows[0].fixed_message || homeContent.fixedMessage;
      const carRes = await pool.query('SELECT * FROM carousel ORDER BY order_index ASC');
      homeContent.carousel = carRes.rows;
    } catch (_) {
      // tables optionnelles, on ignore si absentes
    }

    return res.json({ success: true, products: productsRes.rows, categories: categoriesRes.rows, homeContent });
  } catch (err) {
    console.error('[storefront]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// --- ADMIN PRODUITS (PostgreSQL) ---
app.get('/api/pg/admin/products', authenticateToken, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ message: 'Accès refusé.' });
  try {
    const { rows } = await pool.query(`
      SELECT p.*, pt.name, pt.description, pt.characteristics
      FROM product p
      LEFT JOIN product_translation pt ON pt.product_id = p.id
      LEFT JOIN language l ON pt.language_id = l.id AND l.code = 'fr'
      WHERE p.deleted_at IS NULL
      ORDER BY p.created_at DESC
    `);
    return res.json({ success: true, products: rows });
  } catch (err) {
    console.error('[admin products]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

app.post('/api/pg/admin/products', authenticateToken, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ message: 'Accès refusé.' });
  const { price, stock, image, category_id, name, description, characteristics } = req.body;
  if (!price || stock === undefined || !category_id) {
    return res.status(400).json({ message: 'price, stock et category_id sont obligatoires.' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const productRes = await client.query(
      'INSERT INTO product (price, stock, image, category_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [price, stock, image, category_id],
    );
    const product = productRes.rows[0];
    if (name) {
      const langRes = await client.query("SELECT id FROM language WHERE code = 'fr' LIMIT 1");
      const langId = langRes.rows[0]?.id || 1;
      await client.query(
        'INSERT INTO product_translation (product_id, language_id, name, description, characteristics) VALUES ($1, $2, $3, $4, $5)',
        [product.id, langId, name, description || '', characteristics || ''],
      );
    }
    await client.query('COMMIT');
    return res.status(201).json({ success: true, product });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[admin create product]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  } finally {
    client.release();
  }
});

app.put('/api/pg/admin/products/:id', authenticateToken, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ message: 'Accès refusé.' });
  const { id } = req.params;
  const { price, stock, image, category_id, name, description, characteristics, priority } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      'UPDATE product SET price=$1, stock=$2, image=$3, category_id=$4, priority=$5, updated_at=NOW() WHERE id=$6',
      [price, stock, image, category_id, priority || 0, id],
    );
    if (name !== undefined) {
      const langRes = await client.query("SELECT id FROM language WHERE code = 'fr' LIMIT 1");
      const langId = langRes.rows[0]?.id || 1;
      await client.query(
        `INSERT INTO product_translation (product_id, language_id, name, description, characteristics)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (product_id, language_id) DO UPDATE SET name=$3, description=$4, characteristics=$5`,
        [id, langId, name, description || '', characteristics || ''],
      );
    }
    await client.query('COMMIT');
    return res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[admin update product]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  } finally {
    client.release();
  }
});

app.delete('/api/pg/admin/products/:id', authenticateToken, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ message: 'Accès refusé.' });
  try {
    await pool.query('UPDATE product SET deleted_at = NOW() WHERE id = $1', [req.params.id]);
    return res.json({ success: true });
  } catch (err) {
    console.error('[admin delete product]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// --- ADMIN COMMANDES (PostgreSQL) ---
app.get('/api/pg/admin/orders', authenticateToken, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ message: 'Accès refusé.' });
  try {
    const { rows } = await pool.query(`
      SELECT o.*, u.email AS user_email, u.first_name, u.last_name
      FROM orders o
      LEFT JOIN users u ON u.id = o.user_id
      ORDER BY o.created_at DESC
    `);
    return res.json({ success: true, orders: rows });
  } catch (err) {
    console.error('[admin orders]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

app.get('/api/pg/admin/orders/:id', authenticateToken, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ message: 'Accès refusé.' });
  try {
    const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ message: 'Commande introuvable.' });
    const { rows: items } = await pool.query('SELECT * FROM order_item WHERE order_id = $1', [req.params.id]);
    return res.json({ success: true, order: { ...rows[0], items } });
  } catch (err) {
    console.error('[admin order detail]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

app.put('/api/pg/admin/orders/:id/status', authenticateToken, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ message: 'Accès refusé.' });
  const { status } = req.body;
  if (!status) return res.status(400).json({ message: 'Statut requis.' });
  try {
    await pool.query('UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2', [status, req.params.id]);
    return res.json({ success: true });
  } catch (err) {
    console.error('[admin order status]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// --- ADMIN USERS (PostgreSQL) ---
app.get('/api/pg/admin/users', authenticateToken, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ message: 'Accès refusé.' });
  try {
    const { rows } = await pool.query(
      'SELECT id, email, last_name, first_name, is_admin, created_at FROM users ORDER BY created_at DESC',
    );
    return res.json({ success: true, users: rows });
  } catch (err) {
    console.error('[admin users]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// --- COMMANDES UTILISATEUR (PostgreSQL) ---
app.get('/api/pg/orders', authenticateToken, async (req, res) => {
  try {
    const { rows: orders } = await pool.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id],
    );
    for (const order of orders) {
      const { rows: items } = await pool.query('SELECT * FROM order_item WHERE order_id = $1', [order.id]);
      order.items = items;
    }
    return res.json({ success: true, orders });
  } catch (err) {
    console.error('[user orders]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

app.post('/api/pg/orders', authenticateToken, async (req, res) => {
  const { items, billingAddress, paymentDetails } = req.body;
  if (!items || !items.length) return res.status(400).json({ message: 'Panier vide.' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let total = 0;
    const validatedItems = [];

    for (const item of items) {
      const { rows } = await client.query(
        'SELECT id, price, stock FROM product WHERE id = $1 AND deleted_at IS NULL FOR UPDATE',
        [item.productId],
      );
      const product = rows[0];
      if (!product) {
        await client.query('ROLLBACK');
        return res.status(409).json({ message: `Produit ${item.productId} introuvable.` });
      }
      if (product.stock < item.quantity) {
        await client.query('ROLLBACK');
        return res.status(409).json({ message: `Stock insuffisant pour le produit ${item.productId}.` });
      }
      const lineTotal = product.price * item.quantity;
      total += lineTotal;
      validatedItems.push({ ...item, price: product.price, lineTotal });
    }

    const last4 = paymentDetails?.cardNumber
      ? String(paymentDetails.cardNumber).replace(/\s/g, '').slice(-4)
      : '****';
    const paymentSummary = `Carte **** ${last4}`;

    const orderRes = await client.query(
      `INSERT INTO orders (user_id, status, total_amount, billing_address, payment_summary, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *`,
      [req.user.id, 'En préparation', total, JSON.stringify(billingAddress), paymentSummary],
    );
    const order = orderRes.rows[0];

    for (const item of validatedItems) {
      await client.query(
        'INSERT INTO order_item (order_id, product_id, quantity, unit_price, line_total) VALUES ($1, $2, $3, $4, $5)',
        [order.id, item.productId, item.quantity, item.price, item.lineTotal],
      );
      await client.query('UPDATE product SET stock = stock - $1, updated_at = NOW() WHERE id = $2', [
        item.quantity,
        item.productId,
      ]);
    }

    await client.query('COMMIT');
    return res.status(201).json({ success: true, order: { ...order, items: validatedItems } });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[create order]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  } finally {
    client.release();
  }
});

// --- SUPPORT CONTACT (PostgreSQL) ---
app.post('/api/pg/support/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!email || !message) return res.status(400).json({ message: 'Email et message requis.' });
  try {
    const { rows } = await pool.query(
      'INSERT INTO contact_message (email, subject, message, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id',
      [email, subject || 'Contact', message],
    );
    return res.status(201).json({ success: true, id: rows[0].id });
  } catch (_err) {
    // La table peut ne pas encore exister, on stocke quand même en log
    console.log('[contact]', { name, email, subject, message });
    return res.status(201).json({ success: true });
  }
});

// --- LOGOUT ---
app.post('/api/pg/auth/logout', (req, res) => {
  return res.json({ success: true });
});

// --- CHANGEMENT MOT DE PASSE ---
app.put('/api/pg/auth/password', authenticateToken, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) return res.status(400).json({ message: 'Anciens et nouveau mots de passe requis.' });
  const strong =
    newPassword.length >= 8 &&
    /[A-Z]/.test(newPassword) &&
    /[a-z]/.test(newPassword) &&
    /\d/.test(newPassword) &&
    /[^A-Za-z0-9]/.test(newPassword);
  if (!strong) return res.status(400).json({ message: 'Mot de passe trop faible.' });
  try {
    const { rows } = await pool.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    if (!rows[0]) return res.status(404).json({ message: 'Utilisateur introuvable.' });
    const valid = await bcrypt.compare(oldPassword, rows[0].password);
    if (!valid) return res.status(401).json({ message: 'Ancien mot de passe incorrect.' });
    const hash = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2', [hash, req.user.id]);
    return res.json({ success: true });
  } catch (err) {
    console.error('[change password]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// --- ADMIN STATS (PostgreSQL) ---
app.get('/api/pg/admin/stats', authenticateToken, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ message: 'Accès refusé.' });
  try {
    const [prodRes, ordRes, userRes, revRes, recentRes] = await Promise.all([
      pool.query("SELECT COUNT(*) AS total FROM product WHERE deleted_at IS NULL"),
      pool.query("SELECT COUNT(*) AS total FROM orders"),
      pool.query("SELECT COUNT(*) AS total FROM users WHERE deleted_at IS NULL"),
      pool.query("SELECT COALESCE(SUM(total_amount),0) AS total FROM orders WHERE created_at >= NOW() - INTERVAL '30 days'"),
      pool.query(`
        SELECT o.id, o.status, o.total_amount, o.created_at,
               u.first_name, u.last_name, u.email
        FROM orders o LEFT JOIN users u ON u.id = o.user_id
        ORDER BY o.created_at DESC LIMIT 10
      `),
    ]);
    // Ventes par jour sur 7 jours
    const { rows: dailySales } = await pool.query(`
      SELECT DATE(created_at) AS day, COUNT(*) AS orders, COALESCE(SUM(total_amount),0) AS revenue
      FROM orders WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY day ORDER BY day ASC
    `);
    // Ventes par catégorie
    const { rows: catSales } = await pool.query(`
      SELECT c.name AS category, COUNT(oi.id) AS items_sold,
             COALESCE(SUM(oi.line_total),0) AS revenue
      FROM order_item oi
      JOIN product p ON p.id = oi.product_id
      JOIN category c ON c.id = p.category_id
      GROUP BY c.name ORDER BY revenue DESC
    `);
    return res.json({
      success: true,
      stats: {
        products: Number(prodRes.rows[0].total),
        orders: Number(ordRes.rows[0].total),
        users: Number(userRes.rows[0].total),
        revenue30d: Number(revRes.rows[0].total),
        recentOrders: recentRes.rows,
        dailySales,
        categorySales: catSales,
      },
    });
  } catch (err) {
    console.error('[admin stats]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// --- ADMIN MESSAGES CONTACT ---
app.get('/api/pg/admin/messages', authenticateToken, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ message: 'Accès refusé.' });
  try {
    const { rows } = await pool.query(`
      SELECT cm.*, u.first_name, u.last_name
      FROM contact_message cm
      LEFT JOIN users u ON u.id = cm.user_id
      ORDER BY cm.created_at DESC
    `);
    return res.json({ success: true, messages: rows });
  } catch (err) {
    console.error('[admin messages]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

app.patch('/api/pg/admin/messages/:id', authenticateToken, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ message: 'Accès refusé.' });
  const { status, admin_reply } = req.body;
  if (!status) return res.status(400).json({ message: 'Statut requis.' });
  try {
    // admin_reply column may not exist yet; graceful fallback
    try {
      await pool.query(
        'UPDATE contact_message SET status=$1, admin_reply=$2 WHERE id=$3',
        [status, admin_reply || null, req.params.id],
      );
    } catch (colErr) {
      console.warn('[admin message update] admin_reply column missing, falling back:', colErr.message);
      await pool.query('UPDATE contact_message SET status=$1 WHERE id=$2', [status, req.params.id]);
    }
    return res.json({ success: true });
  } catch (err) {
    console.error('[admin message update]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// --- ADMIN CATEGORIES ---
app.get('/api/pg/admin/categories', authenticateToken, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ message: 'Accès refusé.' });
  try {
    const { rows } = await pool.query('SELECT * FROM category ORDER BY order_index ASC, id ASC');
    return res.json({ success: true, categories: rows });
  } catch (err) {
    console.error('[admin categories]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// --- ADMIN LANGUAGES ---
app.get('/api/pg/admin/languages', authenticateToken, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ message: 'Accès refusé.' });
  try {
    const { rows } = await pool.query('SELECT * FROM language ORDER BY id ASC');
    return res.json({ success: true, languages: rows });
  } catch (err) {
    console.error('[admin languages]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// --- ADMIN USERS : create + update ---
app.post('/api/pg/admin/users', authenticateToken, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ message: 'Accès refusé.' });
  const { email, password, first_name, last_name, is_admin: makeAdmin } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email et mot de passe requis.' });
  try {
    const hash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      'INSERT INTO users (email, password, first_name, last_name, is_admin) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, first_name, last_name, is_admin, created_at',
      [email.toLowerCase().trim(), hash, first_name || '', last_name || '', !!makeAdmin],
    );
    return res.status(201).json({ success: true, user: rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ message: 'Email déjà utilisé.' });
    console.error('[admin create user]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

app.put('/api/pg/admin/users/:id', authenticateToken, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ message: 'Accès refusé.' });
  const { email, first_name, last_name, is_admin: makeAdmin } = req.body;
  try {
    await pool.query(
      'UPDATE users SET email=$1, first_name=$2, last_name=$3, is_admin=$4, updated_at=NOW() WHERE id=$5',
      [email, first_name || '', last_name || '', !!makeAdmin, req.params.id],
    );
    return res.json({ success: true });
  } catch (err) {
    console.error('[admin update user]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// --- ADMIN USERS : soft delete ---
app.patch('/api/pg/admin/users/:id/delete', authenticateToken, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ message: 'Accès refusé.' });
  if (Number(req.params.id) === req.user.id) return res.status(400).json({ message: 'Impossible de supprimer votre propre compte.' });
  try {
    await pool.query('UPDATE users SET deleted_at = NOW() WHERE id = $1', [req.params.id]);
    return res.json({ success: true });
  } catch (err) {
    console.error('[admin delete user]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// --- ADMIN CATEGORIES : CRUD complet ---
app.post('/api/pg/admin/categories', authenticateToken, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ message: 'Accès refusé.' });
  const { name, description, image_url, order_index } = req.body;
  if (!name) return res.status(400).json({ message: 'Nom requis.' });
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  try {
    const { rows } = await pool.query(
      'INSERT INTO category (name, slug, description, image_url, order_index) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, slug, description || '', image_url || '', order_index || 0],
    );
    return res.status(201).json({ success: true, category: rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ message: 'Ce nom/slug existe déjà.' });
    console.error('[admin create category]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

app.put('/api/pg/admin/categories/:id', authenticateToken, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ message: 'Accès refusé.' });
  const { name, description, image_url, order_index } = req.body;
  if (!name) return res.status(400).json({ message: 'Nom requis.' });
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  try {
    await pool.query(
      'UPDATE category SET name=$1, slug=$2, description=$3, image_url=$4, order_index=$5, updated_at=NOW() WHERE id=$6',
      [name, slug, description || '', image_url || '', order_index || 0, req.params.id],
    );
    return res.json({ success: true });
  } catch (err) {
    console.error('[admin update category]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

app.delete('/api/pg/admin/categories/:id', authenticateToken, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ message: 'Accès refusé.' });
  try {
    await pool.query('DELETE FROM category WHERE id=$1', [req.params.id]);
    return res.json({ success: true });
  } catch (err) {
    console.error('[admin delete category]', err.message);
    return res.status(500).json({ message: 'Erreur serveur. Vérifiez qu\'aucun produit n\'est lié.' });
  }
});

// --- ADMIN HOMEPAGE : contenu + carrousel ---
app.get('/api/pg/admin/homepage', authenticateToken, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ message: 'Accès refusé.' });
  try {
    const hcRes = await pool.query('SELECT * FROM homepage_content ORDER BY id LIMIT 1');
    const carRes = await pool.query('SELECT * FROM carousel ORDER BY order_index ASC, id ASC');
    const content = hcRes.rows[0] || { fixed_message: '' };
    return res.json({ success: true, homepage: { fixed_message: content.fixed_message || '', carousel: carRes.rows } });
  } catch (err) {
    console.error('[admin homepage get]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

app.put('/api/pg/admin/homepage', authenticateToken, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ message: 'Accès refusé.' });
  const { fixed_message } = req.body;
  try {
    const exists = await pool.query('SELECT id FROM homepage_content LIMIT 1');
    if (exists.rows[0]) {
      await pool.query('UPDATE homepage_content SET fixed_message=$1, updated_at=NOW() WHERE id=$2', [fixed_message, exists.rows[0].id]);
    } else {
      await pool.query('INSERT INTO homepage_content (fixed_message) VALUES ($1)', [fixed_message]);
    }
    return res.json({ success: true });
  } catch (err) {
    console.error('[admin homepage put]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

app.post('/api/pg/admin/carousel', authenticateToken, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ message: 'Accès refusé.' });
  const { title, subtitle, image_url, link_url, order_index } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO carousel (title, subtitle, image_url, link_url, order_index) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [title || '', subtitle || '', image_url || '', link_url || '', order_index || 0],
    );
    return res.status(201).json({ success: true, slide: rows[0] });
  } catch (err) {
    console.error('[admin carousel add]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

app.put('/api/pg/admin/carousel/:id', authenticateToken, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ message: 'Accès refusé.' });
  const { title, subtitle, image_url, link_url, order_index } = req.body;
  try {
    await pool.query(
      'UPDATE carousel SET title=$1, subtitle=$2, image_url=$3, link_url=$4, order_index=$5 WHERE id=$6',
      [title || '', subtitle || '', image_url || '', link_url || '', order_index || 0, req.params.id],
    );
    return res.json({ success: true });
  } catch (err) {
    console.error('[admin carousel update]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

app.delete('/api/pg/admin/carousel/:id', authenticateToken, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ message: 'Accès refusé.' });
  try {
    await pool.query('DELETE FROM carousel WHERE id=$1', [req.params.id]);
    return res.json({ success: true });
  } catch (err) {
    console.error('[admin carousel delete]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// --- ADMIN PAYMENTS : transactions depuis orders ---
app.get('/api/pg/admin/payments', authenticateToken, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ message: 'Accès refusé.' });
  try {
    const { rows } = await pool.query(`
      SELECT o.id AS order_id, o.total_amount AS amount, o.payment_summary,
             o.status AS order_status, o.created_at,
             u.email, u.first_name, u.last_name
      FROM orders o
      LEFT JOIN users u ON u.id = o.user_id
      ORDER BY o.created_at DESC
    `);
    return res.json({ success: true, payments: rows });
  } catch (err) {
    console.error('[admin payments]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// --- ADMIN SETTINGS (key-value) ---
app.get('/api/pg/admin/settings', authenticateToken, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ message: 'Accès refusé.' });
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS site_settings (
        key   VARCHAR(100) PRIMARY KEY,
        value TEXT         NOT NULL DEFAULT ''
      )
    `);
    const { rows } = await pool.query('SELECT key, value FROM site_settings');
    const settings = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return res.json({ success: true, settings });
  } catch (err) {
    console.error('[admin settings get]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

app.put('/api/pg/admin/settings', authenticateToken, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ message: 'Accès refusé.' });
  const entries = Object.entries(req.body || {});
  if (!entries.length) return res.status(400).json({ message: 'Aucun paramètre fourni.' });
  try {
    for (const [key, value] of entries) {
      await pool.query(
        'INSERT INTO site_settings (key, value) VALUES ($1,$2) ON CONFLICT (key) DO UPDATE SET value=$2',
        [key, String(value)],
      );
    }
    return res.json({ success: true });
  } catch (err) {
    console.error('[admin settings put]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// --- FORGOT PASSWORD (PG) ---
app.post('/api/pg/auth/forgot-password', rateLimit(15 * 60 * 1000, 10), async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email requis.' });
  // Toujours répondre OK pour ne pas divulguer l'existence du compte
  try {
    const { rows } = await pool.query('SELECT id FROM users WHERE email=$1 AND deleted_at IS NULL', [email.toLowerCase().trim()]);
    if (rows[0]) {
      const token = require('node:crypto').randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1h
      await pool.query(
        'INSERT INTO password_reset_token (user_id, token, expires_at) VALUES ($1,$2,$3)',
        [rows[0].id, token, expires],
      );
      // En production : envoyer l'email ici
      console.info('[forgot-password] token généré pour', email, ':', token);
    }
  } catch (err) {
    console.error('[forgot-password]', err.message);
  }
  return res.json({ success: true, message: 'Si ce compte existe, un email a été envoyé.' });
});

// --- RESET PASSWORD (PG) ---
app.post('/api/pg/auth/reset-password', rateLimit(15 * 60 * 1000, 10), async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ message: 'Token et nouveau mot de passe requis.' });
  const strong = newPassword.length >= 8 && /[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword) && /\d/.test(newPassword) && /[^A-Za-z0-9]/.test(newPassword);
  if (!strong) return res.status(400).json({ message: 'Mot de passe trop faible.' });
  try {
    const { rows } = await pool.query(
      'SELECT * FROM password_reset_token WHERE token=$1 AND used_at IS NULL AND expires_at > NOW()',
      [token],
    );
    if (!rows[0]) return res.status(400).json({ message: 'Token invalide ou expiré.' });
    const hash = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET password=$1, updated_at=NOW() WHERE id=$2', [hash, rows[0].user_id]);
    await pool.query('UPDATE password_reset_token SET used_at=NOW() WHERE id=$1', [rows[0].id]);
    return res.json({ success: true });
  } catch (err) {
    console.error('[reset-password]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Error handler global
app.use((err, req, res, _next) => {
  console.error('[Unhandled Error]', err);
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production' ? 'Erreur interne.' : err.message;
  res.status(status).json({ success: false, message });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`[Althea API] Démarrée sur http://localhost:${PORT}`));
