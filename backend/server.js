const express = require('express');

// Connexion PostgreSQL (Neon)
require('dotenv').config();
const pool = require('./db');
const apiRouter = require('./routes');

const PORT = process.env.PORT || 3001;
const app = express();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }

  next();
});

app.use(express.json({ limit: '1mb' }));

app.get('/health', (req, res) => {
  res.json({ success: true, status: 'ok' });
});

app.use('/api', apiRouter);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route introuvable' });
});

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    res.status(400).json({ success: false, message: 'JSON invalide' });
    return;
  }

  console.error(err);
  res.status(500).json({ success: false, message: err.message || 'Erreur serveur' });
});

app.listen(PORT, () => {
  console.log(`API Express running on http://localhost:${PORT}`);
});

module.exports = app;
