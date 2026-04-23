const express = require('express');

const router = express.Router();

router.post('/validate', (req, res) => {
  const { hasUnavailableItems, hasItems } = req.body || {};

  if (hasUnavailableItems) {
    res.status(400).json({ success: false, valid: false, message: 'Retirez les produits indisponibles.' });
    return;
  }

  if (!hasItems) {
    res.status(400).json({ success: false, valid: false, message: 'Panier vide.' });
    return;
  }

  res.json({ success: true, valid: true });
});

router.post('/payment-intent', (req, res) => {
  res.status(201).json({
    success: true,
    clientSecret: `mock-client-secret-${Date.now()}`,
  });
});

module.exports = router;
