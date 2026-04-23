const express = require('express');
const { readDb, updateDb } = require('../data/store');
const { requireAdmin } = require('../middlewares/requireAdmin');
const { asyncHandler } = require('../utils/asyncHandler');

const router = express.Router();

router.post('/contact', asyncHandler(async (req, res) => {
  const { name, email, subject, message } = req.body || {};

  if (!name || !email || !message) {
    res.status(400).json({ success: false, message: 'Nom, email et message sont requis' });
    return;
  }

  const supportMessage = {
    id: `msg-${Date.now()}`,
    name,
    email,
    subject: subject || 'Contact',
    message,
    createdAt: new Date().toISOString(),
    status: 'new',
  };

  await updateDb((draft) => {
    draft.supportMessages.unshift(supportMessage);
  });

  res.status(201).json({ success: true, message: supportMessage });
}));

router.post('/chat', asyncHandler(async (req, res) => {
  const message = String(req.body?.message || '').trim();

  if (!message) {
    res.status(400).json({ success: false, message: 'Message requis' });
    return;
  }

  const chatMessage = {
    id: `chat-${Date.now()}`,
    message,
    reply: `Reponse mockee: ${message}`,
    createdAt: new Date().toISOString(),
  };

  await updateDb((draft) => {
    draft.chatMessages.unshift(chatMessage);
  });

  res.status(201).json({ success: true, reply: chatMessage.reply, chatMessage });
}));

router.get('/messages', requireAdmin, asyncHandler(async (req, res) => {
  const db = await readDb();
  res.json({ success: true, messages: db.supportMessages });
}));

module.exports = router;
