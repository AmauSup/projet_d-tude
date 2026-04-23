const express = require('express');
const { updateDb } = require('../data/store');
const { requireAdmin } = require('../middlewares/requireAdmin');
const { asyncHandler } = require('../utils/asyncHandler');

const router = express.Router();

router.patch('/home/message', requireAdmin, asyncHandler(async (req, res) => {
  const fixedMessage = String(req.body?.fixedMessage || '').trim();

  if (!fixedMessage) {
    res.status(400).json({ success: false, message: 'Message requis' });
    return;
  }

  const nextDb = await updateDb((draft) => {
    draft.homeContent.fixedMessage = fixedMessage;
  });

  res.json({ success: true, homeContent: nextDb.homeContent });
}));

router.patch('/home/carousel/reorder', requireAdmin, asyncHandler(async (req, res) => {
  const { slideId, direction } = req.body || {};

  if (!slideId || !['up', 'down'].includes(direction)) {
    res.status(400).json({ success: false, message: 'Parametres de tri invalides' });
    return;
  }

  const nextDb = await updateDb((draft) => {
    const slides = draft.homeContent.carousel;
    const index = slides.findIndex((slide) => slide.id === slideId);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (index < 0 || targetIndex < 0 || targetIndex >= slides.length) {
      return;
    }

    [slides[index], slides[targetIndex]] = [slides[targetIndex], slides[index]];
  });

  res.json({ success: true, homeContent: nextDb.homeContent });
}));

module.exports = router;
