const express = require('express');
const { readDb, updateDb } = require('../data/store');
const { requireAdmin } = require('../middlewares/requireAdmin');
const { asyncHandler } = require('../utils/asyncHandler');

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  const db = await readDb();
  const categories = [...db.categories].sort((left, right) => left.displayOrder - right.displayOrder);

  res.json({ success: true, categories });
}));

router.patch('/:categoryId', requireAdmin, asyncHandler(async (req, res) => {
  const displayOrder = Number(req.body?.displayOrder);

  if (!Number.isInteger(displayOrder)) {
    res.status(400).json({ success: false, message: 'Ordre de categorie invalide' });
    return;
  }

  const nextDb = await updateDb((draft) => {
    const category = draft.categories.find((candidate) => candidate.id === req.params.categoryId);

    if (category) {
      category.displayOrder = displayOrder;
    }
  });
  const category = nextDb.categories.find((candidate) => candidate.id === req.params.categoryId);

  if (!category) {
    res.status(404).json({ success: false, message: 'Categorie introuvable' });
    return;
  }

  res.json({ success: true, category });
}));

module.exports = router;
