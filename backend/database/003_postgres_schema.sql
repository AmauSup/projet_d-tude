-- =============================================================
-- MIGRATION 003 — Schéma PostgreSQL complet pour Althea Systems
-- Compatible Neon (PostgreSQL 15+)
-- Exécuter idempotent : utilise IF NOT EXISTS / ON CONFLICT
-- =============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- -------------------------
-- LANGUES
-- -------------------------
CREATE TABLE IF NOT EXISTS language (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  code        VARCHAR(10)  NOT NULL UNIQUE,
  is_rtl      BOOLEAN      NOT NULL DEFAULT FALSE
);

INSERT INTO language (name, code, is_rtl) VALUES
  ('Français', 'fr', FALSE),
  ('English',  'en', FALSE),
  ('العربية',  'ar', TRUE)
ON CONFLICT (code) DO NOTHING;

-- -------------------------
-- CATÉGORIES
-- -------------------------
CREATE TABLE IF NOT EXISTS category (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  slug        VARCHAR(120) NOT NULL UNIQUE,
  description TEXT,
  image_url   VARCHAR(512),
  order_index INT          NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_category_order ON category(order_index);

-- -------------------------
-- UTILISATEURS
-- -------------------------
CREATE TABLE IF NOT EXISTS users (
  id                  SERIAL PRIMARY KEY,
  email               VARCHAR(255) NOT NULL UNIQUE,
  password            TEXT         NOT NULL,
  first_name          VARCHAR(100),
  last_name           VARCHAR(100),
  phone               VARCHAR(30),
  is_admin            BOOLEAN      NOT NULL DEFAULT FALSE,
  is_verified         BOOLEAN      NOT NULL DEFAULT FALSE,
  email_verified_at   TIMESTAMPTZ,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- -------------------------
-- TOKENS (vérification email + reset password)
-- -------------------------
CREATE TABLE IF NOT EXISTS email_verification_token (
  id         SERIAL PRIMARY KEY,
  user_id    INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      VARCHAR(128) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ  NOT NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS password_reset_token (
  id         SERIAL PRIMARY KEY,
  user_id    INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      VARCHAR(128) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ  NOT NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- -------------------------
-- ADRESSES
-- -------------------------
CREATE TABLE IF NOT EXISTS address (
  id          SERIAL PRIMARY KEY,
  user_id     INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        VARCHAR(20)  NOT NULL DEFAULT 'billing' CHECK (type IN ('billing','shipping','other')),
  first_name  VARCHAR(100),
  last_name   VARCHAR(100),
  address1    VARCHAR(255) NOT NULL,
  address2    VARCHAR(255),
  city        VARCHAR(100) NOT NULL,
  region      VARCHAR(100),
  postal_code VARCHAR(20)  NOT NULL,
  country     VARCHAR(100) NOT NULL DEFAULT 'France',
  phone       VARCHAR(30),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_address_user ON address(user_id);

-- -------------------------
-- MÉTHODES DE PAIEMENT (références provider uniquement, jamais de PAN brut)
-- -------------------------
CREATE TABLE IF NOT EXISTS payment_method (
  id              SERIAL PRIMARY KEY,
  user_id         INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider        VARCHAR(50)  NOT NULL DEFAULT 'card',
  last4           VARCHAR(4),
  expiry_month    SMALLINT,
  expiry_year     SMALLINT,
  cardholder_name VARCHAR(200),
  is_default      BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_method_user ON payment_method(user_id);

-- -------------------------
-- PRODUITS
-- -------------------------
CREATE TABLE IF NOT EXISTS product (
  id          SERIAL PRIMARY KEY,
  price       NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  stock       INT           NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image       TEXT,
  category_id INT           NOT NULL REFERENCES category(id) ON DELETE RESTRICT,
  priority    INT           NOT NULL DEFAULT 0,
  featured    INT           NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_product_category   ON product(category_id);
CREATE INDEX IF NOT EXISTS idx_product_price       ON product(price);
CREATE INDEX IF NOT EXISTS idx_product_stock       ON product(stock);
CREATE INDEX IF NOT EXISTS idx_product_priority    ON product(priority);
CREATE INDEX IF NOT EXISTS idx_product_created_at  ON product(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_deleted_at  ON product(deleted_at) WHERE deleted_at IS NOT NULL;

-- -------------------------
-- TRADUCTIONS PRODUITS
-- -------------------------
CREATE TABLE IF NOT EXISTS product_translation (
  id               SERIAL PRIMARY KEY,
  product_id       INT  NOT NULL REFERENCES product(id) ON DELETE CASCADE,
  language_id      INT  NOT NULL REFERENCES language(id) ON DELETE RESTRICT,
  name             VARCHAR(512) NOT NULL,
  description      TEXT,
  characteristics  TEXT,
  UNIQUE (product_id, language_id)
);

CREATE INDEX IF NOT EXISTS idx_pt_product   ON product_translation(product_id);
CREATE INDEX IF NOT EXISTS idx_pt_language  ON product_translation(language_id);
-- Index trigram pour la recherche floue
CREATE INDEX IF NOT EXISTS idx_pt_name_trgm ON product_translation USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_pt_desc_trgm ON product_translation USING gin(description gin_trgm_ops);

-- -------------------------
-- CONTENU PAGE D'ACCUEIL
-- -------------------------
CREATE TABLE IF NOT EXISTS homepage_content (
  id            SERIAL PRIMARY KEY,
  fixed_message TEXT,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO homepage_content (fixed_message)
SELECT 'Bienvenue sur Althea Systems — votre partenaire en matériel médical.'
WHERE NOT EXISTS (SELECT 1 FROM homepage_content);

CREATE TABLE IF NOT EXISTS carousel (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(255),
  subtitle    TEXT,
  image_url   VARCHAR(512),
  link_url    VARCHAR(512),
  order_index INT         NOT NULL DEFAULT 0,
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  category_id INT         REFERENCES category(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_carousel_order ON carousel(order_index);

CREATE TABLE IF NOT EXISTS top_product (
  id          SERIAL PRIMARY KEY,
  product_id  INT NOT NULL REFERENCES product(id) ON DELETE CASCADE,
  order_index INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_top_product_order ON top_product(order_index);

-- -------------------------
-- COMMANDES
-- -------------------------
CREATE TABLE IF NOT EXISTS orders (
  id               SERIAL PRIMARY KEY,
  user_id          INT           REFERENCES users(id) ON DELETE SET NULL,
  status           VARCHAR(50)   NOT NULL DEFAULT 'En préparation',
  total_amount     NUMERIC(12,2) NOT NULL DEFAULT 0,
  billing_address  JSONB,
  payment_summary  VARCHAR(255),
  note             TEXT,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user       ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status     ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

CREATE TABLE IF NOT EXISTS order_item (
  id         SERIAL PRIMARY KEY,
  order_id   INT           NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INT           REFERENCES product(id) ON DELETE SET NULL,
  quantity   INT           NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12,2) NOT NULL,
  line_total NUMERIC(12,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_order_item_order   ON order_item(order_id);
CREATE INDEX IF NOT EXISTS idx_order_item_product ON order_item(product_id);

-- -------------------------
-- TRANSACTIONS PAIEMENT
-- -------------------------
CREATE TABLE IF NOT EXISTS payment_transaction (
  id         SERIAL PRIMARY KEY,
  order_id   INT           NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider   VARCHAR(50)   NOT NULL DEFAULT 'simulated',
  status     VARCHAR(50)   NOT NULL DEFAULT 'pending',
  amount     NUMERIC(12,2) NOT NULL,
  reference  VARCHAR(255),
  created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_tx_order ON payment_transaction(order_id);

-- -------------------------
-- FACTURES
-- -------------------------
CREATE TABLE IF NOT EXISTS invoice (
  id         SERIAL PRIMARY KEY,
  order_id   INT         NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  pdf_url    VARCHAR(512),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------
-- MESSAGES CONTACT
-- -------------------------
CREATE TABLE IF NOT EXISTS contact_message (
  id          SERIAL PRIMARY KEY,
  user_id     INT          REFERENCES users(id) ON DELETE SET NULL,
  email       VARCHAR(255) NOT NULL,
  subject     VARCHAR(255),
  message     TEXT         NOT NULL,
  status      VARCHAR(50)  NOT NULL DEFAULT 'new',
  admin_reply TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_msg_status ON contact_message(status);

-- -------------------------
-- CHATBOT
-- -------------------------
CREATE TABLE IF NOT EXISTS chatbot_conversation (
  id         SERIAL PRIMARY KEY,
  user_id    INT         REFERENCES users(id) ON DELETE SET NULL,
  status     VARCHAR(50) NOT NULL DEFAULT 'open',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at   TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS chatbot_message (
  id              SERIAL PRIMARY KEY,
  conversation_id INT         NOT NULL REFERENCES chatbot_conversation(id) ON DELETE CASCADE,
  sender          VARCHAR(20) NOT NULL CHECK (sender IN ('user','bot')),
  message         TEXT        NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chatbot_msg_conv ON chatbot_message(conversation_id);

-- -------------------------
-- LOGS ADMIN
-- -------------------------
CREATE TABLE IF NOT EXISTS admin_log (
  id         SERIAL PRIMARY KEY,
  admin_id   INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action     VARCHAR(100) NOT NULL,
  entity     VARCHAR(100),
  entity_id  INT,
  details    JSONB,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_log_admin ON admin_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_log_date  ON admin_log(created_at DESC);
