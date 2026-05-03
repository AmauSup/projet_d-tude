// db.js
// Connexion à PostgreSQL (Neon)
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // ssl: { rejectUnauthorized: false } // décommente si besoin pour Neon
});

module.exports = pool;
