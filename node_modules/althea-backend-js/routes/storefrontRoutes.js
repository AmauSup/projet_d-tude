const express = require('express');
const { readDb } = require('../data/store');
const { asyncHandler } = require('../utils/asyncHandler');

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  const db = await readDb();

  res.json({
    success: true,
    homeContent: db.homeContent,
    categories: [...db.categories].sort((left, right) => left.displayOrder - right.displayOrder),
    products: db.products,
  });
}));

module.exports = router;
