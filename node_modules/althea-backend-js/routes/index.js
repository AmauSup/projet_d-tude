const express = require('express');
const accountRoutes = require('./accountRoutes');
const adminRoutes = require('./adminRoutes');
const authRoutes = require('./authRoutes');
const categoryRoutes = require('./categoryRoutes');
const checkoutRoutes = require('./checkoutRoutes');
const contentRoutes = require('./contentRoutes');
const orderRoutes = require('./orderRoutes');
const productRoutes = require('./productRoutes');
const storefrontRoutes = require('./storefrontRoutes');
const supportRoutes = require('./supportRoutes');


const pool = require('../db');
const router = express.Router();

// Test connexion PostgreSQL + insertion user si ?insert=1
router.get('/health', async (req, res) => {
  try {
    if (req.query.insert === '1') {
      const email = `testuser_${Date.now()}@test.com`;
      const insert = await pool.query(
        `INSERT INTO users (last_name, first_name, email, password) VALUES ($1, $2, $3, $4) RETURNING id, email`,
        ['Test', 'User', email, 'testpass']
      );
      return res.json({ success: true, inserted: insert.rows[0] });
    }
    const result = await pool.query('SELECT 1 as ok');
    res.json({ success: true, status: 'ok', db: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.use('/account', accountRoutes);
router.use('/admin', adminRoutes);
router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/checkout', checkoutRoutes);
router.use('/content', contentRoutes);
router.use('/orders', orderRoutes);
router.use('/products', productRoutes);
router.use('/storefront', storefrontRoutes);
router.use('/support', supportRoutes);

module.exports = router;
