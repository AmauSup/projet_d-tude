'use strict';

const express = require('express');
const router = express.Router();
const {
  pool,
  authenticateToken,
  requireAdmin,
  logAdmin,
  adminRateLimit,
  broadcastHomeUpdate,
  bcrypt,
} = require('../backend/shared.js');
const mailer = require('../backend/mailer.js');

// Statuts de commande valides
const ORDER_STATUSES = ['En préparation', 'Confirmée', 'Expédiée', 'Livrée', 'Annulée'];

// --- ADMIN PRODUITS (PostgreSQL) ---
router.get('/api/pg/admin/products', authenticateToken, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ message: 'Accès refusé.' });
  try {
    const { rows } = await pool.query(`
      SELECT p.*, pt.name, pt.description, pt.characteristics,
             c.name AS category_name
      FROM product p
      LEFT JOIN product_translation pt ON pt.product_id = p.id
      LEFT JOIN language l ON pt.language_id = l.id AND l.code = 'fr'
      LEFT JOIN category c ON c.id = p.category_id
      WHERE p.deleted_at IS NULL
      ORDER BY p.created_at DESC
    `);
    return res.json({ success: true, products: rows });
  } catch (err) {
    console.error('[admin products]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.post('/api/pg/admin/products', authenticateToken, async (req, res) => {
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
    logAdmin(req.user.id, 'create_product', `product:${product.id}`);
    broadcastHomeUpdate();
    return res.status(201).json({ success: true, product });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[admin create product]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  } finally {
    client.release();
  }
});

router.put('/api/pg/admin/products/:id', authenticateToken, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ message: 'Accès refusé.' });
  const { id } = req.params;
  const { price, stock, image, category_id, name, description, characteristics, priority, featured, slug } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const setClauses = [];
    const values = [];
    const add = (col, val) => { setClauses.push(`${col}=$${values.push(val)}`); };

    if (price !== undefined)       add('price', price);
    if (stock !== undefined)       add('stock', stock);
    if (image !== undefined)       add('image', image);
    if (category_id !== undefined) add('category_id', category_id);
    if (priority !== undefined)    add('priority', priority || 0);
    if (featured !== undefined)    add('featured', featured || 0);
    if (slug !== undefined)        add('slug', slug || null);

    if (setClauses.length > 0) {
      values.push(id);
      await client.query(
        `UPDATE product SET ${setClauses.join(', ')}, updated_at=NOW() WHERE id=$${values.length}`,
        values,
      );
    }

    logAdmin(req.user.id, 'update_product', `product:${id}`);
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
    broadcastHomeUpdate();
    return res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[admin update product]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  } finally {
    client.release();
  }
});

router.delete('/api/pg/admin/products/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await pool.query('UPDATE product SET deleted_at = NOW() WHERE id = $1', [req.params.id]);
    logAdmin(req.user.id, 'delete_product', `product:${req.params.id}`);
    broadcastHomeUpdate();
    return res.json({ success: true });
  } catch (err) {
    console.error('[admin delete product]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// GET produit individuel (admin)
router.get('/api/pg/admin/products/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT p.*, pt.name, pt.description, pt.characteristics,
             c.name AS category_name, c.slug AS category_slug
      FROM product p
      LEFT JOIN product_translation pt ON pt.product_id = p.id
      LEFT JOIN language l ON pt.language_id = l.id AND l.code = 'fr'
      LEFT JOIN category c ON c.id = p.category_id
      WHERE p.id = $1 AND p.deleted_at IS NULL
    `, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ message: 'Produit introuvable.' });
    return res.json({ success: true, product: rows[0] });
  } catch (err) {
    console.error('[admin product detail]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// --- ADMIN COMMANDES (PostgreSQL) ---
router.get('/api/pg/admin/orders', authenticateToken, async (req, res) => {
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

router.get('/api/pg/admin/orders/:id', authenticateToken, async (req, res) => {
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

router.put('/api/pg/admin/orders/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ message: 'Statut requis.' });
  if (!ORDER_STATUSES.includes(status)) {
    return res.status(400).json({ message: `Statut invalide. Valeurs acceptées : ${ORDER_STATUSES.join(', ')}.` });
  }
  try {
    const result = await pool.query(
      'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id',
      [status, req.params.id],
    );
    if (!result.rows[0]) return res.status(404).json({ message: 'Commande introuvable.' });
    logAdmin(req.user.id, 'update_order_status', `order:${req.params.id}:${status}`);
    return res.json({ success: true });
  } catch (err) {
    console.error('[admin order status]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// --- ADMIN USERS (PostgreSQL) ---
router.get('/api/pg/admin/users', authenticateToken, async (req, res) => {
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

// --- ADMIN STATS (PostgreSQL) — avec filtre de période ---
// ?period=7d (défaut) | 5w | 30d | 90d
router.get('/api/pg/admin/stats', authenticateToken, requireAdmin, adminRateLimit, async (req, res) => {
  try {
    const period = req.query.period || '7d';

    // Calculer l'intervalle PostgreSQL et la granularité en fonction de la période
    let interval, labelExpr;
    if (period === '5w') {
      interval = '5 weeks';
      labelExpr = "TO_CHAR(DATE_TRUNC('week', created_at), 'YYYY-WW')";
    } else if (period === '30d') {
      interval = '30 days';
      labelExpr = "TO_CHAR(DATE(created_at), 'MM-DD')";
    } else if (period === '90d') {
      interval = '90 days';
      labelExpr = "TO_CHAR(DATE_TRUNC('week', created_at), 'MM-DD')";
    } else {
      interval = '7 days';
      labelExpr = "TO_CHAR(DATE(created_at), 'MM-DD')";
    }

    const [prodRes, ordRes, userRes, revRes, recentRes, stockRes] = await Promise.all([
      pool.query('SELECT COUNT(*) AS total FROM product WHERE deleted_at IS NULL'),
      pool.query('SELECT COUNT(*) AS total FROM orders'),
      pool.query('SELECT COUNT(*) AS total FROM users WHERE deleted_at IS NULL'),
      pool.query(`SELECT COALESCE(SUM(total_amount),0) AS total FROM orders WHERE created_at >= NOW() - INTERVAL '30 days'`),
      pool.query(`
        SELECT o.id, o.status, o.total_amount, o.created_at,
               u.first_name, u.last_name, u.email
        FROM orders o LEFT JOIN users u ON u.id = o.user_id
        ORDER BY o.created_at DESC LIMIT 10
      `),
      pool.query('SELECT COUNT(*) AS total FROM product WHERE stock = 0 AND deleted_at IS NULL'),
    ]);

    // Ventes par période — GROUP BY sur la même expression que SELECT pour éviter l'erreur PostgreSQL
    const { rows: periodSales } = await pool.query(`
      SELECT ${labelExpr} AS label,
             COUNT(*) AS orders,
             COALESCE(SUM(total_amount), 0) AS revenue
      FROM orders
      WHERE created_at >= NOW() - INTERVAL '${interval}'
      GROUP BY ${labelExpr}
      ORDER BY MIN(created_at) ASC
    `);

    // Paniers moyens par catégorie sur la période
    const { rows: avgBasketByCat } = await pool.query(`
      SELECT c.name AS category,
             ROUND(AVG(oi.line_total / oi.quantity), 2) AS avg_unit_price,
             COALESCE(SUM(oi.line_total), 0) AS total_revenue,
             COUNT(DISTINCT oi.order_id) AS order_count
      FROM order_item oi
      JOIN product p ON p.id = oi.product_id
      JOIN category c ON c.id = p.category_id
      JOIN orders o ON o.id = oi.order_id
      WHERE o.created_at >= NOW() - INTERVAL '${interval}'
      GROUP BY c.name
      ORDER BY total_revenue DESC
    `);

    // Répartition des ventes par catégorie (tous temps pour le camembert)
    const { rows: catSales } = await pool.query(`
      SELECT c.name AS category,
             COUNT(oi.id) AS items_sold,
             COALESCE(SUM(oi.line_total), 0) AS revenue
      FROM order_item oi
      JOIN product p ON p.id = oi.product_id
      JOIN category c ON c.id = p.category_id
      GROUP BY c.name
      ORDER BY revenue DESC
    `);

    return res.json({
      success: true,
      period,
      stats: {
        products: Number(prodRes.rows[0].total),
        orders: Number(ordRes.rows[0].total),
        users: Number(userRes.rows[0].total),
        revenue30d: Number(revRes.rows[0].total),
        outOfStockProducts: Number(stockRes.rows[0].total),
        recentOrders: recentRes.rows,
        dailySales: periodSales,
        avgBasketByCategory: avgBasketByCat,
        categorySales: catSales,
      },
    });
  } catch (err) {
    console.error('[admin stats]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// --- ADMIN MESSAGES CONTACT ---
router.get('/api/pg/admin/messages', authenticateToken, async (req, res) => {
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

router.patch('/api/pg/admin/messages/:id', authenticateToken, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ message: 'Accès refusé.' });
  const { status, admin_reply } = req.body;
  if (!status) return res.status(400).json({ message: 'Statut requis.' });
  try {
    // Fetch email + subject before update so we can send the reply email
    const { rows: existing } = await pool.query(
      'SELECT email, subject FROM contact_message WHERE id=$1',
      [req.params.id],
    );
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

    let email_sent = false;
    if (status === 'replied' && admin_reply && existing[0]?.email) {
      try {
        await mailer.sendAdminReply(existing[0].email, existing[0].subject, admin_reply);
        email_sent = true;
      } catch (mailErr) {
        console.warn('[admin message update] email send failed:', mailErr.message);
      }
    }

    return res.json({ success: true, email_sent });
  } catch (err) {
    console.error('[admin message update]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.delete('/api/pg/admin/messages/:id', authenticateToken, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ message: 'Accès refusé.' });
  try {
    await pool.query('DELETE FROM contact_message WHERE id=$1', [req.params.id]);
    return res.json({ success: true });
  } catch (err) {
    console.error('[admin message delete]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// --- ADMIN CATEGORIES ---
router.get('/api/pg/admin/categories', authenticateToken, async (req, res) => {
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
router.get('/api/pg/admin/languages', authenticateToken, async (req, res) => {
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
router.post('/api/pg/admin/users', authenticateToken, async (req, res) => {
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

router.put('/api/pg/admin/users/:id', authenticateToken, async (req, res) => {
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
router.patch('/api/pg/admin/users/:id/delete', authenticateToken, async (req, res) => {
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
router.post('/api/pg/admin/categories', authenticateToken, async (req, res) => {
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

router.put('/api/pg/admin/categories/:id', authenticateToken, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ message: 'Accès refusé.' });
  const { name, description, image_url, order_index, visible } = req.body;
  const setClauses = [];
  const values = [];
  const add = (col, val) => { setClauses.push(`${col}=$${values.push(val)}`); };
  if (name !== undefined) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    add('name', name); add('slug', slug);
  }
  if (description !== undefined) add('description', description || '');
  if (image_url   !== undefined) add('image_url',   image_url  || '');
  if (order_index !== undefined) add('order_index', order_index ?? 0);
  if (visible     !== undefined) add('visible',     visible);
  if (setClauses.length === 0) return res.status(400).json({ message: 'Aucun champ à mettre à jour.' });
  values.push(req.params.id);
  try {
    await pool.query(
      `UPDATE category SET ${setClauses.join(', ')}, updated_at=NOW() WHERE id=$${values.length}`,
      values,
    );
    broadcastHomeUpdate();
    return res.json({ success: true });
  } catch (err) {
    console.error('[admin update category]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.patch('/api/pg/admin/carousel/:id/visible', authenticateToken, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ message: 'Accès refusé.' });
  const { visible } = req.body;
  if (visible === undefined) return res.status(400).json({ message: 'Champ visible requis.' });
  try {
    await pool.query('UPDATE carousel SET visible=$1 WHERE id=$2', [visible, req.params.id]);
    broadcastHomeUpdate();
    return res.json({ success: true });
  } catch (err) {
    console.error('[admin carousel visible]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.delete('/api/pg/admin/categories/:id', authenticateToken, async (req, res) => {
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
router.get('/api/pg/admin/homepage', authenticateToken, async (req, res) => {
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

router.put('/api/pg/admin/homepage', authenticateToken, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ message: 'Accès refusé.' });
  const { fixed_message } = req.body;
  try {
    const exists = await pool.query('SELECT id FROM homepage_content LIMIT 1');
    if (exists.rows[0]) {
      await pool.query('UPDATE homepage_content SET fixed_message=$1, updated_at=NOW() WHERE id=$2', [fixed_message, exists.rows[0].id]);
    } else {
      await pool.query('INSERT INTO homepage_content (fixed_message) VALUES ($1)', [fixed_message]);
    }
    broadcastHomeUpdate();
    return res.json({ success: true });
  } catch (err) {
    console.error('[admin homepage put]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.post('/api/pg/admin/carousel', authenticateToken, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ message: 'Accès refusé.' });
  const { title, subtitle, image_url, link_url, order_index, badge, cta_label } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO carousel (title, subtitle, image_url, link_url, order_index, badge, cta_label) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [title || '', subtitle || '', image_url || '', link_url || '', order_index || 0, badge || '', cta_label || 'Voir la catégorie'],
    );
    broadcastHomeUpdate();
    return res.status(201).json({ success: true, slide: rows[0] });
  } catch (err) {
    console.error('[admin carousel add]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.put('/api/pg/admin/carousel/:id', authenticateToken, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ message: 'Accès refusé.' });
  const { title, subtitle, image_url, link_url, order_index, badge, cta_label } = req.body;
  try {
    await pool.query(
      'UPDATE carousel SET title=$1, subtitle=$2, image_url=$3, link_url=$4, order_index=$5, badge=$6, cta_label=$7 WHERE id=$8',
      [title || '', subtitle || '', image_url || '', link_url || '', order_index || 0, badge || '', cta_label || 'Voir la catégorie', req.params.id],
    );
    broadcastHomeUpdate();
    return res.json({ success: true });
  } catch (err) {
    console.error('[admin carousel update]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.delete('/api/pg/admin/carousel/:id', authenticateToken, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ message: 'Accès refusé.' });
  try {
    await pool.query('DELETE FROM carousel WHERE id=$1', [req.params.id]);
    broadcastHomeUpdate();
    return res.json({ success: true });
  } catch (err) {
    console.error('[admin carousel delete]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// --- ADMIN PAYMENTS : transactions depuis orders ---
router.get('/api/pg/admin/payments', authenticateToken, async (req, res) => {
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
router.get('/api/pg/admin/settings', authenticateToken, async (req, res) => {
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

router.put('/api/pg/admin/settings', authenticateToken, async (req, res) => {
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

// --- ADMIN LOGS (lecture) ---
router.get('/api/pg/admin/logs', authenticateToken, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ message: 'Accès refusé.' });
  try {
    const { rows } = await pool.query(`
      SELECT al.*, u.email AS admin_email
      FROM admin_log al LEFT JOIN users u ON u.id = al.admin_id
      ORDER BY al.created_at DESC LIMIT 200
    `);
    return res.json({ success: true, logs: rows });
  } catch (err) {
    console.error('[admin logs]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;
