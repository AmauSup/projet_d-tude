'use strict';

require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const routes = require('./routes');
const mailer = require('./mailer');

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '2mb' }));
const ALLOWED_ORIGINS = new Set([
  process.env.FRONTEND_URL || 'http://localhost:5173',
  process.env.ADMIN_URL || 'http://localhost:5174',
]);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.has(origin)) return cb(null, true);
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
  ssl: process.env.DATABASE_URL?.includes('neon.tech')
    ? { rejectUnauthorized: false }
    : undefined,
});

const JWT_SECRET = process.env.JWT_SECRET || 'althea-dev-secret-change-in-prod';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '1d';

// Expose pool et jwt pour les routes modulaires
app.locals.pool = pool;
app.locals.jwtSecret = JWT_SECRET;
app.locals.jwtExpires = JWT_EXPIRES;

// Les migrations de schéma sont gérées par les fichiers SQL dans /database/
// Exécuter 003_postgres_schema.sql puis 004_incremental_migration.sql puis 005_consolidation.sql
// avant le premier démarrage. Les migrations auto sont supprimées pour éviter les effets de bord.
pool.query('SELECT 1').then(() => console.info('[DB] Connexion PostgreSQL établie.')).catch((e) => console.error('[DB] Connexion échouée :', e.message));

// Migration incrémentale : ajout email_verified + table de tokens de vérification + type message chatbot
pool.query(`
  ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT TRUE;
  CREATE TABLE IF NOT EXISTS email_verification_token (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ
  );
  ALTER TABLE contact_message ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'contact';
`).catch((e) => console.warn('[DB migration email_verified]', e.message));

// Migration : table des moyens de paiement enregistrés par les utilisateurs
pool.query(`
  CREATE TABLE IF NOT EXISTS payment_method (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  ALTER TABLE payment_method ADD COLUMN IF NOT EXISTS user_id         INT          REFERENCES users(id) ON DELETE CASCADE;
  ALTER TABLE payment_method ADD COLUMN IF NOT EXISTS provider        VARCHAR(50)  NOT NULL DEFAULT 'card';
  ALTER TABLE payment_method ADD COLUMN IF NOT EXISTS last4           CHAR(4)      NOT NULL DEFAULT '0000';
  ALTER TABLE payment_method ADD COLUMN IF NOT EXISTS expiry_month    SMALLINT     NOT NULL DEFAULT 1;
  ALTER TABLE payment_method ADD COLUMN IF NOT EXISTS expiry_year     SMALLINT     NOT NULL DEFAULT 2030;
  ALTER TABLE payment_method ADD COLUMN IF NOT EXISTS cardholder_name VARCHAR(255) NOT NULL DEFAULT '';
  ALTER TABLE payment_method ADD COLUMN IF NOT EXISTS is_default      BOOLEAN      NOT NULL DEFAULT FALSE;
  ALTER TABLE payment_method ADD COLUMN IF NOT EXISTS created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW();
  CREATE INDEX IF NOT EXISTS idx_payment_method_user ON payment_method(user_id);
`).catch((e) => console.warn('[DB migration payment_method]', e.message));

// Drop accidental NOT NULL without DEFAULT on payment_method.name if present
pool.query(`
  DO $$ BEGIN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'payment_method' AND column_name = 'name'
    ) THEN
      ALTER TABLE payment_method ALTER COLUMN name DROP NOT NULL;
    END IF;
  END $$;
`).catch((e) => console.warn('[DB migration payment_method.name]', e.message));

// Migration : tables de traductions UI et catégories
pool.query(`
  CREATE TABLE IF NOT EXISTS app_translation (
    id          SERIAL PRIMARY KEY,
    language_id INT          NOT NULL REFERENCES language(id) ON DELETE CASCADE,
    namespace   VARCHAR(50)  NOT NULL,
    key         VARCHAR(120) NOT NULL,
    value       TEXT         NOT NULL,
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (language_id, namespace, key)
  );
  CREATE INDEX IF NOT EXISTS idx_app_tr_lang ON app_translation(language_id);

  CREATE TABLE IF NOT EXISTS category_translation (
    id          SERIAL PRIMARY KEY,
    category_id INT NOT NULL REFERENCES category(id) ON DELETE CASCADE,
    language_id INT NOT NULL REFERENCES language(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL DEFAULT '',
    description TEXT,
    UNIQUE (category_id, language_id)
  );
  CREATE INDEX IF NOT EXISTS idx_cat_tr_cat  ON category_translation(category_id);
  CREATE INDEX IF NOT EXISTS idx_cat_tr_lang ON category_translation(language_id);
`).catch((e) => console.warn('[DB migration translations]', e.message));

// Seed traductions de catégories (EN / AR / HE) — ne remplace que les noms vides
pool.query(`
  INSERT INTO category_translation (category_id, language_id, name, description)
  SELECT c.id, l.id, v.name, v.description
  FROM (VALUES
    ('diagnostic','en','Diagnostic',       'Blood pressure monitors, stethoscopes, portable ECG and measuring devices for routine examinations.'),
    ('monitoring', 'en','Monitoring',       'Multiparameter monitors, holters and pulse oximeters for continuous patient monitoring.'),
    ('sterilisation','en','Sterilisation',  'Autoclaves, sealers and traceability solutions for sterilisation protocols.'),
    ('imagerie',   'en','Imaging',          'Ultrasound scanners and visualisation accessories for mobile and versatile practice.'),
    ('consommables','en','Consumables',     'Sensors, electrodes, cuffs and consumables compatible with catalogue equipment.'),
    ('mobilier',   'en','Medical Furniture','Examination chairs, trolleys and furniture designed to optimise care spaces.'),

    ('diagnostic','ar','التشخيص',    'مقاييس ضغط الدم والسماعات الطبية وأجهزة القياس للفحوصات الروتينية.'),
    ('monitoring', 'ar','المراقبة',   'أجهزة مراقبة متعددة المعاملات وأجهزة هولتر لمتابعة المرضى باستمرار.'),
    ('sterilisation','ar','التعقيم', 'الأوتوكلاف وآلات اللحام ومحاليل التتبع لبروتوكولات التعقيم.'),
    ('imagerie',   'ar','التصوير الطبي','أجهزة الموجات فوق الصوتية وملحقات التصور للممارسة المتنقلة.'),
    ('consommables','ar','المستلزمات','المستشعرات والأقطاب الكهربائية والمستلزمات المتوافقة مع أجهزة الكتالوج.'),
    ('mobilier',   'ar','الأثاث الطبي','كراسي الفحص والعربات والأثاث المصمم لتحسين أماكن الرعاية.'),

    ('diagnostic','he','אבחון',         'מד לחץ דם, סטטוסקופים ומכשירי מדידה לבדיקות שגרתיות.'),
    ('monitoring', 'he','ניטור',         'מוניטורים מרובי-פרמטרים, הולטרים ומד-חמצן למעקב רציף אחר המטופל.'),
    ('sterilisation','he','עיקור',       'אוטוקלב, מכשירי איטום ופתרונות מעקב לפרוטוקולי עיקור.'),
    ('imagerie',   'he','הדמיה',         'מכשירי אולטרסאונד ואביזרי הדמיה לעבודה ניידת ורב-תכליתית.'),
    ('consommables','he','חומרים מתכלים','חיישנים, אלקטרודות וחומרים מתכלים תואמים לציוד הקטלוג.'),
    ('mobilier',   'he','ריהוט רפואי',   'כיסאות בדיקה, עגלות וריהוט לאופטימיזציה של חדרי הטיפול.')
  ) AS v(slug, lang_code, name, description)
  JOIN category c ON c.slug = v.slug
  JOIN language l ON l.code = v.lang_code
  ON CONFLICT (category_id, language_id) DO UPDATE
    SET name        = EXCLUDED.name,
        description = EXCLUDED.description
    WHERE category_translation.name IS NULL OR category_translation.name = ''
`).catch((e) => console.warn('[DB seed category translations]', e.message));

// Migration : ajout des colonnes badge et cta_label sur carousel
pool.query(`
  ALTER TABLE carousel ADD COLUMN IF NOT EXISTS badge     VARCHAR(100) DEFAULT '';
  ALTER TABLE carousel ADD COLUMN IF NOT EXISTS cta_label VARCHAR(150) DEFAULT 'Voir la catégorie';
`).catch((e) => console.warn('[DB migration carousel columns]', e.message));

async function logAdmin(adminId, action, target) {
  await pool.query(
    'INSERT INTO admin_log (admin_id, action, target, created_at) VALUES ($1,$2,$3,NOW())',
    [adminId, action, target || null],
  ).catch((e) => console.warn('[admin_log]', e.message));
}


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

// Statuts de commande valides
const ORDER_STATUSES = ['En préparation', 'Confirmée', 'Expédiée', 'Livrée', 'Annulée'];

// Middleware admin réutilisable
function requireAdmin(req, res, next) {
  if (!req.user?.is_admin) return res.status(403).json({ message: 'Accès réservé aux administrateurs.' });
  return next();
}

// Rate limiter admin (plus strict pour les mutations)
const adminRateLimit = rateLimit(15 * 60 * 1000, 200);

// =====================================================================
// Routes modulaires legacy (db.json) — DÉSACTIVÉES
// Toutes les données transitent désormais par PostgreSQL via /api/pg/*
// Conserver le montage uniquement en mode développement pour diagnostic.
// =====================================================================
if (process.env.ENABLE_LEGACY_ROUTES === 'true') {
  app.use('/api/legacy', routes);
  console.warn('[Althea] Routes legacy db.json montées sur /api/legacy (ENABLE_LEGACY_ROUTES=true)');
} else {
  // Renvoyer 410 Gone sur toute route /api/* non capturée par les routes pg ci-dessous
  app.use('/api', (req, res, next) => {
    if (!req.path.startsWith('/pg/')) {
      return res.status(410).json({
        message: 'Ces routes ont été migrées vers /api/pg/*. Veuillez mettre à jour vos appels.',
      });
    }
    return next();
  });
}

// =====================================================================
// Routes PostgreSQL directes (seules routes actives en production)
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
  // En dev sans SMTP configuré, on auto-vérifie le compte pour éviter le blocage à la connexion
  const smtpConfigured = !!process.env.SMTP_HOST;
  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing.rows.length > 0) return res.status(409).json({ message: 'Email déjà utilisé.' });
    const hash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      'INSERT INTO users (email, password, last_name, first_name, email_verified) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, last_name, first_name, is_admin',
      [email.toLowerCase().trim(), hash, last_name, first_name, !smtpConfigured],
    );
    const user = result.rows[0];

    if (!smtpConfigured) {
      // Mode dev sans email : connexion directe, pas de confirmation requise
      console.info('[DEV] Compte auto-vérifié (SMTP non configuré) :', user.email);
      const token = jwt.sign({ id: user.id, is_admin: false }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
      return res.status(201).json({
        success: true,
        requires_confirmation: false,
        token,
        user: { id: user.id, email: user.email, last_name: user.last_name, first_name: user.first_name },
      });
    }

    // Créer un token de vérification valable 72h
    const verificationToken = require('node:crypto').randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 72 * 60 * 60 * 1000);
    await pool.query(
      'INSERT INTO email_verification_token (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, verificationToken, verificationExpires],
    );
    const verifyLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/#/verify-email?token=${verificationToken}`;
    mailer.sendEmailVerification(user, verifyLink).catch((e) => console.warn('[mailer verify]', e.message));
    return res.status(201).json({
      success: true,
      requires_confirmation: true,
      user: { id: user.id, email: user.email, last_name: user.last_name, first_name: user.first_name },
    });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ message: 'Email déjà utilisé.' });
    console.error('[register]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Connexion
// Stockage en mémoire des OTP admin (userId → { otp, expires, user })
const adminOtpStore = new Map();

app.post('/api/pg/auth/login', rateLimit(15 * 60 * 1000, 20), async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email et mot de passe requis.' });
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    const user = rows[0];
    if (!user) return res.status(401).json({ message: 'Identifiants invalides.' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Identifiants invalides.' });

    // Vérification email obligatoire avant connexion (seulement si SMTP configuré)
    if (process.env.SMTP_HOST && !user.email_verified) {
      return res.status(403).json({
        message: 'Compte non confirmé. Veuillez cliquer sur le lien reçu par e-mail pour activer votre compte.',
        unconfirmed: true,
      });
    }

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

// Vérification OTP 2FA admin
app.post('/api/pg/auth/verify-2fa', rateLimit(15 * 60 * 1000, 10), async (req, res) => {
  const { user_id, otp } = req.body;
  if (!user_id || !otp) return res.status(400).json({ message: 'user_id et otp requis.' });
  const entry = adminOtpStore.get(Number(user_id));
  if (!entry) return res.status(401).json({ message: 'Code expiré ou invalide.' });
  if (Date.now() > entry.expires) {
    adminOtpStore.delete(Number(user_id));
    return res.status(401).json({ message: 'Code expiré. Reconnectez-vous.' });
  }
  if (entry.otp !== String(otp).trim()) return res.status(401).json({ message: 'Code incorrect.' });
  adminOtpStore.delete(Number(user_id));
  const { user } = entry;
  const token = jwt.sign({ id: user.id, is_admin: user.is_admin }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
  return res.json({
    success: true,
    token,
    user: { id: user.id, email: user.email, last_name: user.last_name, first_name: user.first_name, role: 'admin', is_admin: true },
  });
});

// Vérification email (clic sur le lien reçu par mail)
app.get('/api/pg/auth/verify-email', async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ message: 'Token manquant.' });
  try {
    // Cherche le token valide (non expiré) — qu'il soit déjà utilisé ou non
    const { rows } = await pool.query(
      `SELECT t.*, u.email_verified AS already_verified
       FROM email_verification_token t
       JOIN users u ON u.id = t.user_id
       WHERE t.token = $1 AND t.expires_at > NOW()`,
      [token],
    );
    if (!rows[0]) return res.status(400).json({ message: 'Lien invalide ou expiré. Demandez un nouveau lien via la page de renvoi.' });

    const tokenRow = rows[0];

    // Idempotent : si le token a déjà été consommé mais le compte est bien vérifié
    // (ex : double-clic, rechargement page, React StrictMode en dev), on retourne succès.
    if (tokenRow.used_at !== null) {
      if (tokenRow.already_verified) {
        const { rows: userRows } = await pool.query('SELECT * FROM users WHERE id=$1', [tokenRow.user_id]);
        const user = userRows[0];
        const jwtToken = jwt.sign({ id: user.id, is_admin: user.is_admin }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
        return res.json({
          success: true,
          token: jwtToken,
          user: { id: user.id, email: user.email, last_name: user.last_name, first_name: user.first_name, role: user.is_admin ? 'admin' : 'customer', is_admin: user.is_admin },
        });
      }
      return res.status(400).json({ message: 'Lien déjà utilisé. Demandez un nouveau lien.' });
    }

    await pool.query('UPDATE users SET email_verified=TRUE WHERE id=$1', [tokenRow.user_id]);
    await pool.query('UPDATE email_verification_token SET used_at=NOW() WHERE id=$1', [tokenRow.id]);
    const { rows: userRows } = await pool.query('SELECT * FROM users WHERE id=$1', [tokenRow.user_id]);
    const user = userRows[0];
    const jwtToken = jwt.sign({ id: user.id, is_admin: user.is_admin }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    mailer.sendWelcome(user).catch((e) => console.warn('[mailer welcome]', e.message));
    return res.json({
      success: true,
      token: jwtToken,
      user: { id: user.id, email: user.email, last_name: user.last_name, first_name: user.first_name, role: user.is_admin ? 'admin' : 'customer', is_admin: user.is_admin },
    });
  } catch (err) {
    console.error('[verify-email]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Renvoi du lien de vérification email
app.post('/api/pg/auth/resend-verification', rateLimit(15 * 60 * 1000, 5), async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email requis.' });
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email=$1 AND email_verified=FALSE', [email.toLowerCase().trim()]);
    if (!rows[0]) return res.json({ success: true }); // Pas de révélation si l'email existe
    const user = rows[0];
    const verificationToken = require('node:crypto').randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 72 * 60 * 60 * 1000);
    await pool.query(
      'INSERT INTO email_verification_token (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, verificationToken, verificationExpires],
    );
    if (!process.env.SMTP_HOST) {
      // En dev, auto-vérifier directement sans envoyer d'email
      await pool.query('UPDATE users SET email_verified=TRUE WHERE id=$1', [user.id]);
      const verifyLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/#/verify-email?token=${verificationToken}`;
      console.info('[DEV] Compte auto-vérifié via resend (SMTP non configuré) :', user.email);
      console.info('[DEV] Lien de vérification :', verifyLink);
      return res.json({ success: true });
    }
    const verifyLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/#/verify-email?token=${verificationToken}`;
    mailer.sendEmailVerification(user, verifyLink).catch((e) => console.warn('[mailer resend-verify]', e.message));
    return res.json({ success: true });
  } catch (err) {
    console.error('[resend-verification]', err.message);
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

// --- TRADUCTIONS UI ---
app.get('/api/pg/translations/:locale', async (req, res) => {
  try {
    const { locale } = req.params;
    const { rows } = await pool.query(
      `SELECT at.namespace, at.key, at.value
       FROM app_translation at
       JOIN language l ON l.id = at.language_id
       WHERE l.code = $1`,
      [locale],
    );
    const result = {};
    for (const { namespace, key, value } of rows) {
      if (!result[namespace]) result[namespace] = {};
      result[namespace][key] = value;
    }
    return res.json({ success: true, translations: result });
  } catch (err) {
    console.error('[translations]', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// --- PRODUITS PUBLICS ---
app.get('/api/pg/products', async (req, res) => {
  const locale = req.query.locale || 'fr';
  try {
    const { rows } = await pool.query(`
      SELECT p.id, p.price, p.stock, p.image, p.category_id, p.created_at, p.updated_at,
             COALESCE(p.priority,0) AS priority, COALESCE(p.featured,0) AS featured,
             p.slug,
             COALESCE(NULLIF(pt_loc.name,''), pt_fr.name) AS name,
             COALESCE(NULLIF(pt_loc.description,''), pt_fr.description) AS description,
             COALESCE(NULLIF(pt_loc.characteristics,''), pt_fr.characteristics) AS characteristics,
             c.name AS category_name, c.slug AS category_slug
      FROM product p
      LEFT JOIN product_translation pt_loc ON pt_loc.product_id = p.id
        AND pt_loc.language_id = (SELECT id FROM language WHERE code = $1 LIMIT 1)
      LEFT JOIN product_translation pt_fr ON pt_fr.product_id = p.id
        AND pt_fr.language_id = (SELECT id FROM language WHERE code = 'fr' LIMIT 1)
      LEFT JOIN category c ON c.id = p.category_id
      WHERE p.deleted_at IS NULL
      ORDER BY p.created_at DESC
    `, [locale]);
    return res.json({ success: true, products: rows });
  } catch (err) {
    console.error('[products]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// --- STOREFRONT ---
app.get('/api/pg/storefront', async (req, res) => {
  const locale = req.query.locale || 'fr';
  try {
    const [productsRes, categoriesRes] = await Promise.all([
      pool.query(`
        SELECT p.id, p.price, p.stock, p.image, p.category_id, p.created_at,
               COALESCE(p.priority,0) AS priority, COALESCE(p.featured,0) AS featured,
               p.slug,
               COALESCE(NULLIF(pt_loc.name,''), pt_fr.name) AS name,
               COALESCE(NULLIF(pt_loc.description,''), pt_fr.description) AS description,
               COALESCE(NULLIF(pt_loc.characteristics,''), pt_fr.characteristics) AS characteristics,
               c.slug AS category_slug
        FROM product p
        LEFT JOIN product_translation pt_loc ON pt_loc.product_id = p.id
          AND pt_loc.language_id = (SELECT id FROM language WHERE code = $1 LIMIT 1)
        LEFT JOIN product_translation pt_fr ON pt_fr.product_id = p.id
          AND pt_fr.language_id = (SELECT id FROM language WHERE code = 'fr' LIMIT 1)
        LEFT JOIN category c ON c.id = p.category_id
        WHERE p.deleted_at IS NULL
        ORDER BY p.created_at DESC
      `, [locale]),
      pool.query(`
        SELECT c.id, c.slug, c.order_index, c.image_url,
          COALESCE(NULLIF(ct_loc.name,''), NULLIF(ct_fr.name,''), c.name, '') AS name,
          COALESCE(NULLIF(ct_loc.description,''), NULLIF(ct_fr.description,''), '') AS description
        FROM category c
        LEFT JOIN category_translation ct_loc ON ct_loc.category_id = c.id
          AND ct_loc.language_id = (SELECT id FROM language WHERE code = $1 LIMIT 1)
        LEFT JOIN category_translation ct_fr ON ct_fr.category_id = c.id
          AND ct_fr.language_id = (SELECT id FROM language WHERE code = 'fr' LIMIT 1)
        ORDER BY c.order_index ASC, c.id ASC
      `, [locale]),
    ]);

    let homeContent = { fixedMessage: 'Bienvenue sur Althea Systems.', carousel: [] };
    try {
      const hcRes = await pool.query('SELECT * FROM homepage_content ORDER BY id LIMIT 1');
      homeContent.fixedMessage = hcRes.rows[0]?.fixed_message || homeContent.fixedMessage;
      const carRes = await pool.query('SELECT * FROM carousel ORDER BY order_index ASC');
      homeContent.carousel = carRes.rows;
    } catch (e) {
      console.warn('[storefront] tables optionnelles absentes:', e.message);
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
    logAdmin(req.user.id, 'create_product', `product:${product.id}`);
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
    return res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[admin update product]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  } finally {
    client.release();
  }
});

app.delete('/api/pg/admin/products/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await pool.query('UPDATE product SET deleted_at = NOW() WHERE id = $1', [req.params.id]);
    logAdmin(req.user.id, 'delete_product', `product:${req.params.id}`);
    return res.json({ success: true });
  } catch (err) {
    console.error('[admin delete product]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// GET produit individuel (admin)
app.get('/api/pg/admin/products/:id', authenticateToken, requireAdmin, async (req, res) => {
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

app.put('/api/pg/admin/orders/:id/status', authenticateToken, requireAdmin, async (req, res) => {
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

// Téléchargement de la facture PDF d'une commande
app.get('/api/pg/orders/:id/invoice', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT o.*, u.first_name, u.last_name, u.email FROM orders o JOIN users u ON u.id = o.user_id WHERE o.id = $1',
      [req.params.id],
    );
    const order = rows[0];
    if (!order) return res.status(404).json({ message: 'Commande introuvable.' });
    // Vérifier que la commande appartient à l'utilisateur (ou qu'il est admin)
    if (order.user_id !== req.user.id && !req.user.is_admin) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }
    const { rows: items } = await pool.query(
      `SELECT oi.quantity, oi.unit_price, oi.line_total,
              COALESCE(pt.name, p.slug) AS product_name
       FROM order_item oi
       JOIN product p ON p.id = oi.product_id
       LEFT JOIN product_translation pt ON pt.product_id = p.id
       LEFT JOIN language l ON l.id = pt.language_id AND l.code = 'fr'
       WHERE oi.order_id = $1`,
      [order.id],
    );

    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="facture-${order.id}.pdf"`);
    doc.pipe(res);

    // En-tête
    doc.fontSize(20).text('Althea Systems', { align: 'left' });
    doc.fontSize(10).fillColor('#666').text('Matériel médical professionnel', { align: 'left' });
    doc.moveDown();
    doc.fillColor('#000').fontSize(16).text(`Facture n° ${order.id}`, { align: 'right' });
    doc.fontSize(10).text(`Date : ${new Date(order.created_at).toLocaleDateString('fr-FR')}`, { align: 'right' });
    doc.moveDown(2);

    // Informations client
    doc.fontSize(11).text('Facturé à :', { underline: true });
    doc.fontSize(10).text(`${order.first_name} ${order.last_name}`);
    doc.text(order.email);
    if (order.billing_address) {
      const addr = typeof order.billing_address === 'string' ? JSON.parse(order.billing_address) : order.billing_address;
      if (addr.address1) doc.text(addr.address1);
      if (addr.city) doc.text(`${addr.postal_code || ''} ${addr.city}`);
      if (addr.country) doc.text(addr.country);
    }
    doc.moveDown();

    // Tableau produits
    doc.fontSize(11).text('Détail de la commande :', { underline: true });
    doc.moveDown(0.5);
    const tableTop = doc.y;
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Produit', 50, tableTop);
    doc.text('Qté', 340, tableTop);
    doc.text('P.U.', 390, tableTop);
    doc.text('Total', 460, tableTop);
    doc.font('Helvetica');
    doc.moveDown(0.3);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();

    let y = doc.y + 5;
    for (const item of items) {
      doc.text(item.product_name || '—', 50, y, { width: 280 });
      doc.text(String(item.quantity), 340, y);
      doc.text(`${Number(item.unit_price || 0).toFixed(2)} €`, 390, y);
      doc.text(`${Number(item.line_total || 0).toFixed(2)} €`, 460, y);
      y += 20;
    }

    doc.moveTo(50, y).lineTo(550, y).stroke();
    y += 8;
    doc.fontSize(11).font('Helvetica-Bold').text(`Total TTC : ${Number(order.total_amount || 0).toFixed(2)} €`, 390, y);

    doc.moveDown(3);
    doc.fontSize(9).font('Helvetica').fillColor('#888').text('Althea Systems — TVA 20% incluse — Document généré automatiquement', { align: 'center' });

    doc.end();
  } catch (err) {
    console.error('[invoice]', err.message);
    if (!res.headersSent) res.status(500).json({ message: 'Erreur génération facture.' });
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
        'INSERT INTO order_item (order_id, product_id, quantity, unit_price, line_total, subtotal) VALUES ($1, $2, $3, $4, $5, $6)',
        [order.id, item.productId, item.quantity, item.price, item.lineTotal, item.lineTotal],
      );
      await client.query('UPDATE product SET stock = stock - $1, updated_at = NOW() WHERE id = $2', [
        item.quantity,
        item.productId,
      ]);
    }

    await client.query('COMMIT');

    // Enregistrement de la transaction de paiement (simulée)
    pool.query(
      `INSERT INTO payment_transaction (order_id, provider, status, amount, reference)
       VALUES ($1, $2, $3, $4, $5)`,
      [order.id, 'simulated', 'completed', total, `SIM-${order.id}-${Date.now()}`],
    ).catch((e) => console.warn('[payment_transaction insert]', e.message));

    // Email de confirmation commande (simulé)
    try {
      const userRes = await pool.query('SELECT email, first_name FROM users WHERE id=$1', [req.user.id]);
      const u = userRes.rows[0];
      if (u) {
        mailer.sendOrderConfirmation(u, {
          id: order.id,
          total_amount: total,
          items: validatedItems.map((i) => ({ product_id: i.productId, quantity: i.quantity, line_total: i.price * i.quantity })),
        }).catch((e) => console.warn('[mailer order]', e.message));
      }
    } catch (emailErr) {
      console.warn('[order email]', emailErr.message);
    }

    return res.status(201).json({ success: true, order: { ...order, items: validatedItems } });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[create order]', err.message);
    return res.status(500).json({ message: err.message || 'Erreur serveur.' });
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
  } catch (err) {
    console.warn('[contact] table indisponible, log fallback:', err.message, { name, email, subject, message });
    return res.status(201).json({ success: true });
  }
});

// --- LOGOUT ---
app.post('/api/pg/auth/logout', (_req, res) => {
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

// --- SUPPRESSION DE COMPTE (RGPD) ---
app.delete('/api/pg/auth/account', authenticateToken, async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ message: 'Mot de passe requis pour confirmer la suppression.' });
  try {
    const { rows } = await pool.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    if (!rows[0]) return res.status(404).json({ message: 'Utilisateur introuvable.' });
    const valid = await bcrypt.compare(password, rows[0].password);
    if (!valid) return res.status(401).json({ message: 'Mot de passe incorrect.' });
    await pool.query('BEGIN');
    try {
      await pool.query('DELETE FROM email_verification_token WHERE user_id = $1', [req.user.id]);
      await pool.query('DELETE FROM password_reset_token WHERE user_id = $1', [req.user.id]);
      await pool.query('DELETE FROM orders WHERE user_id = $1', [req.user.id]);
      await pool.query('DELETE FROM payment_method WHERE user_id = $1', [req.user.id]);
      await pool.query('DELETE FROM users WHERE id = $1', [req.user.id]);
      await pool.query('COMMIT');
    } catch (innerErr) {
      await pool.query('ROLLBACK');
      throw innerErr;
    }
    return res.json({ success: true });
  } catch (err) {
    console.error('[delete account]', err.message);
    return res.status(500).json({ message: 'Erreur serveur lors de la suppression du compte.' });
  }
});

// --- ADMIN STATS (PostgreSQL) — avec filtre de période ---
// ?period=7d (défaut) | 5w | 30d | 90d
app.get('/api/pg/admin/stats', authenticateToken, requireAdmin, adminRateLimit, async (req, res) => {
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

// Escalade chatbot vers agent humain — sauvegarde la conversation dans contact_message
app.post('/api/pg/support/chatbot-escalate', async (req, res) => {
  const { email, transcript } = req.body;
  if (!transcript) return res.status(400).json({ message: 'Transcription requise.' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO contact_message (email, subject, message, message_type, created_at)
       VALUES ($1, $2, $3, 'chatbot', NOW()) RETURNING id`,
      [email || 'anonyme@chatbot', 'Escalade chatbot — demande agent humain', transcript],
    );
    return res.status(201).json({ success: true, id: rows[0].id });
  } catch (err) {
    console.error('[chatbot-escalate]', err.message);
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
  const { title, subtitle, image_url, link_url, order_index, badge, cta_label } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO carousel (title, subtitle, image_url, link_url, order_index, badge, cta_label) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [title || '', subtitle || '', image_url || '', link_url || '', order_index || 0, badge || '', cta_label || 'Voir la catégorie'],
    );
    return res.status(201).json({ success: true, slide: rows[0] });
  } catch (err) {
    console.error('[admin carousel add]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

app.put('/api/pg/admin/carousel/:id', authenticateToken, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ message: 'Accès refusé.' });
  const { title, subtitle, image_url, link_url, order_index, badge, cta_label } = req.body;
  try {
    await pool.query(
      'UPDATE carousel SET title=$1, subtitle=$2, image_url=$3, link_url=$4, order_index=$5, badge=$6, cta_label=$7 WHERE id=$8',
      [title || '', subtitle || '', image_url || '', link_url || '', order_index || 0, badge || '', cta_label || 'Voir la catégorie', req.params.id],
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
      mailer.sendPasswordReset(rows[0], `${process.env.FRONTEND_URL || 'http://localhost:5173'}/#/reset-password?token=${token}`).catch((e) => console.warn('[mailer reset]', e.message));
    }
  } catch (err) {
    console.error('[forgot-password]', err.message);
  }
  return res.json({ success: true, message: 'Si ce compte existe, un email a été envoyé.' });
});

// Alias pour la compatibilité avec le frontend
app.post('/api/pg/auth/request-reset-password', rateLimit(15 * 60 * 1000, 10), async (req, res) => {
  req.url = '/api/pg/auth/forgot-password';
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email requis.' });
  try {
    const { rows } = await pool.query('SELECT id FROM users WHERE email=$1 AND deleted_at IS NULL', [email.toLowerCase().trim()]);
    if (rows[0]) {
      const token = require('node:crypto').randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 60 * 60 * 1000);
      await pool.query(
        'INSERT INTO password_reset_token (user_id, token, expires_at) VALUES ($1,$2,$3)',
        [rows[0].id, token, expires],
      );
      mailer.sendPasswordReset(rows[0], `${process.env.FRONTEND_URL || 'http://localhost:5173'}/#/reset-password?token=${token}`).catch((e) => console.warn('[mailer reset]', e.message));
    }
  } catch (err) {
    console.error('[request-reset-password]', err.message);
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

// --- ADRESSES UTILISATEUR ---
app.get('/api/pg/auth/addresses', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM user_address WHERE user_id=$1 ORDER BY is_default DESC, created_at ASC',
      [req.user.id],
    );
    return res.json({ success: true, addresses: rows });
  } catch (err) {
    console.error('[addresses get]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

app.post('/api/pg/auth/addresses', authenticateToken, async (req, res) => {
  const { label, type, first_name, last_name, address1, address2, city, postal_code, region, country, phone, email, is_default } = req.body;
  if (!address1 || !city) return res.status(400).json({ message: 'Adresse et ville requises.' });
  try {
    if (is_default) {
      await pool.query('UPDATE user_address SET is_default=FALSE WHERE user_id=$1', [req.user.id]);
    }
    const { rows } = await pool.query(
      `INSERT INTO user_address (user_id,label,type,first_name,last_name,address1,address2,city,postal_code,region,country,phone,email,is_default)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [req.user.id, label||'', type||'shipping', first_name||'', last_name||'', address1, address2||'', city, postal_code||'', region||'', country||'France', phone||'', email||'', !!is_default],
    );
    return res.status(201).json({ success: true, address: rows[0] });
  } catch (err) {
    console.error('[address create]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

app.put('/api/pg/auth/addresses/:id', authenticateToken, async (req, res) => {
  const { label, type, first_name, last_name, address1, address2, city, postal_code, region, country, phone, email, is_default } = req.body;
  try {
    const own = await pool.query('SELECT id FROM user_address WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    if (!own.rows[0]) return res.status(404).json({ message: 'Adresse introuvable.' });
    if (is_default) {
      await pool.query('UPDATE user_address SET is_default=FALSE WHERE user_id=$1', [req.user.id]);
    }
    await pool.query(
      `UPDATE user_address SET label=$1,type=$2,first_name=$3,last_name=$4,address1=$5,address2=$6,city=$7,postal_code=$8,region=$9,country=$10,phone=$11,email=$12,is_default=$13 WHERE id=$14`,
      [label||'', type||'shipping', first_name||'', last_name||'', address1, address2||'', city, postal_code||'', region||'', country||'France', phone||'', email||'', !!is_default, req.params.id],
    );
    return res.json({ success: true });
  } catch (err) {
    console.error('[address update]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

app.delete('/api/pg/auth/addresses/:id', authenticateToken, async (req, res) => {
  try {
    const own = await pool.query('SELECT id FROM user_address WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    if (!own.rows[0]) return res.status(404).json({ message: 'Adresse introuvable.' });
    await pool.query('DELETE FROM user_address WHERE id=$1', [req.params.id]);
    return res.json({ success: true });
  } catch (err) {
    console.error('[address delete]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// --- MÉTHODES DE PAIEMENT (last4 uniquement, jamais de PAN brut) ---
app.get('/api/pg/auth/payment-methods', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, provider, last4, expiry_month, expiry_year, cardholder_name, is_default, created_at FROM payment_method WHERE user_id=$1 ORDER BY is_default DESC, created_at DESC',
      [req.user.id],
    );
    return res.json({ success: true, paymentMethods: rows });
  } catch (err) {
    console.error('[payment-methods get]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

app.post('/api/pg/auth/payment-methods', authenticateToken, async (req, res) => {
  const { cardholder_name, card_number, expiry, is_default } = req.body;
  if (!cardholder_name || !card_number || !expiry) {
    return res.status(400).json({ message: 'Nom, numéro de carte et expiration sont obligatoires.' });
  }
  const cleanNumber = String(card_number).replace(/\s/g, '');
  if (!/^\d{13,19}$/.test(cleanNumber)) {
    return res.status(400).json({ message: 'Numéro de carte invalide.' });
  }
  const last4 = cleanNumber.slice(-4);
  const [monthStr, yearStr] = String(expiry).split('/');
  const expiryMonth = parseInt(monthStr, 10);
  const expiryYear = parseInt(yearStr?.length === 2 ? `20${yearStr}` : yearStr, 10);
  if (!expiryMonth || expiryMonth < 1 || expiryMonth > 12 || !expiryYear) {
    return res.status(400).json({ message: 'Date d\'expiration invalide (format MM/AA).' });
  }
  try {
    if (is_default) {
      await pool.query('UPDATE payment_method SET is_default=FALSE WHERE user_id=$1', [req.user.id]);
    }
    const setDefault = is_default || false;
    const { rows } = await pool.query(
      `INSERT INTO payment_method (user_id, provider, last4, expiry_month, expiry_year, cardholder_name, is_default)
       VALUES ($1, 'card', $2, $3, $4, $5, $6) RETURNING id, provider, last4, expiry_month, expiry_year, cardholder_name, is_default, created_at`,
      [req.user.id, last4, expiryMonth, expiryYear, cardholder_name.trim(), setDefault],
    );
    return res.status(201).json({ success: true, paymentMethod: rows[0] });
  } catch (err) {
    console.error('[payment-methods post]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

app.patch('/api/pg/auth/payment-methods/:id/default', authenticateToken, async (req, res) => {
  try {
    const own = await pool.query('SELECT id FROM payment_method WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    if (!own.rows[0]) return res.status(404).json({ message: 'Méthode de paiement introuvable.' });
    await pool.query('UPDATE payment_method SET is_default=FALSE WHERE user_id=$1', [req.user.id]);
    await pool.query('UPDATE payment_method SET is_default=TRUE WHERE id=$1', [req.params.id]);
    return res.json({ success: true });
  } catch (err) {
    console.error('[payment-methods default]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

app.delete('/api/pg/auth/payment-methods/:id', authenticateToken, async (req, res) => {
  try {
    const own = await pool.query('SELECT id FROM payment_method WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    if (!own.rows[0]) return res.status(404).json({ message: 'Méthode de paiement introuvable.' });
    await pool.query('DELETE FROM payment_method WHERE id=$1', [req.params.id]);
    return res.json({ success: true });
  } catch (err) {
    console.error('[payment-methods delete]', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// --- ADMIN LOGS (lecture) ---
app.get('/api/pg/admin/logs', authenticateToken, async (req, res) => {
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

// Error handler global
app.use((err, _req, res, _next) => {
  console.error('[Unhandled Error]', err);
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production' ? 'Erreur interne.' : err.message;
  res.status(status).json({ success: false, message });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`[Althea API] Démarrée sur http://localhost:${PORT}`));
