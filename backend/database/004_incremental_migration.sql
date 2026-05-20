-- =============================================================
-- MIGRATION 004 — Mise à jour incrémentale du schéma Neon
-- Ajoute les colonnes manquantes aux tables existantes
-- et crée les tables absentes.
-- Idempotent : IF NOT EXISTS / ADD COLUMN IF NOT EXISTS
-- =============================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- -------------------------
-- TABLE language
-- -------------------------
ALTER TABLE language ADD COLUMN IF NOT EXISTS code   VARCHAR(10) DEFAULT 'fr';
ALTER TABLE language ADD COLUMN IF NOT EXISTS is_rtl BOOLEAN     NOT NULL DEFAULT FALSE;

-- Initialiser code à partir du nom si non défini
UPDATE language SET code = 'fr' WHERE LOWER(name) LIKE '%fran%' AND (code IS NULL OR code = '');
UPDATE language SET code = 'en' WHERE LOWER(name) LIKE '%engl%' AND (code IS NULL OR code = '');
UPDATE language SET code = 'ar' WHERE LOWER(name) LIKE '%arab%' AND (code IS NULL OR code = '');
UPDATE language SET code = LOWER(SUBSTRING(name, 1, 2)) WHERE (code IS NULL OR code = '');

-- Ajouter contrainte UNIQUE sur code (ignorée si déjà présente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'language_code_key' AND conrelid = 'language'::regclass
  ) THEN
    ALTER TABLE language ADD CONSTRAINT language_code_key UNIQUE (code);
  END IF;
END $$;

-- Insérer langues manquantes
INSERT INTO language (name, code, is_rtl) VALUES
  ('Français', 'fr', FALSE),
  ('English',  'en', FALSE),
  ('العربية',  'ar', TRUE)
ON CONFLICT (code) DO NOTHING;

-- -------------------------
-- TABLE category
-- -------------------------
ALTER TABLE category ADD COLUMN IF NOT EXISTS slug        VARCHAR(120);
ALTER TABLE category ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE category ADD COLUMN IF NOT EXISTS image_url   VARCHAR(512);
ALTER TABLE category ADD COLUMN IF NOT EXISTS order_index INT         NOT NULL DEFAULT 0;
ALTER TABLE category ADD COLUMN IF NOT EXISTS created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE category ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Générer slug à partir du nom pour les lignes sans slug
UPDATE category
SET slug = LOWER(REGEXP_REPLACE(TRIM(name), '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL OR slug = '';

-- Contrainte UNIQUE sur slug
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'category_slug_key' AND conrelid = 'category'::regclass
  ) THEN
    ALTER TABLE category ADD CONSTRAINT category_slug_key UNIQUE (slug);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_category_order ON category(order_index);

-- -------------------------
-- TABLE users
-- -------------------------
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone             VARCHAR(30);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified       BOOLEAN     NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at        TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- -------------------------
-- TABLE orders
-- -------------------------
ALTER TABLE orders ADD COLUMN IF NOT EXISTS billing_address  TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_summary  VARCHAR(255);

-- -------------------------
-- TABLE order_item
-- -------------------------
-- Le backend utilise line_total ; la table a subtotal → ajouter line_total
ALTER TABLE order_item ADD COLUMN IF NOT EXISTS line_total NUMERIC(12,2);

-- Backfill line_total depuis subtotal
UPDATE order_item SET line_total = subtotal WHERE line_total IS NULL AND subtotal IS NOT NULL;

-- -------------------------
-- TABLE product
-- -------------------------
ALTER TABLE product ADD COLUMN IF NOT EXISTS priority   INT         NOT NULL DEFAULT 0;
ALTER TABLE product ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_product_category ON product(category_id);
CREATE INDEX IF NOT EXISTS idx_product_deleted  ON product(deleted_at) WHERE deleted_at IS NULL;

-- -------------------------
-- TOKENS
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
-- CONTENU HOMEPAGE
-- -------------------------
CREATE TABLE IF NOT EXISTS homepage_content (
  id            SERIAL PRIMARY KEY,
  fixed_message TEXT,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS carousel (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(255),
  subtitle    TEXT,
  image_url   VARCHAR(512),
  link_url    VARCHAR(512),
  order_index INT         NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS top_product (
  id         SERIAL PRIMARY KEY,
  product_id INT NOT NULL REFERENCES product(id) ON DELETE CASCADE,
  rank       INT NOT NULL DEFAULT 0
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
  status      VARCHAR(50)  NOT NULL DEFAULT 'open',
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
  role            VARCHAR(20) NOT NULL,
  content         TEXT        NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------
-- PAIEMENTS & FACTURES
-- -------------------------
CREATE TABLE IF NOT EXISTS payment_transaction (
  id             SERIAL PRIMARY KEY,
  order_id       INT            NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider       VARCHAR(100)   NOT NULL DEFAULT 'stripe',
  provider_ref   VARCHAR(255),
  amount         NUMERIC(12,2)  NOT NULL,
  currency       CHAR(3)        NOT NULL DEFAULT 'EUR',
  status         VARCHAR(50)    NOT NULL DEFAULT 'pending',
  created_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoice (
  id         SERIAL PRIMARY KEY,
  order_id   INT         NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  number     VARCHAR(50) NOT NULL UNIQUE,
  pdf_url    VARCHAR(512),
  issued_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------
-- LOGS ADMIN
-- -------------------------
CREATE TABLE IF NOT EXISTS admin_log (
  id         SERIAL PRIMARY KEY,
  admin_id   INT         REFERENCES users(id) ON DELETE SET NULL,
  action     VARCHAR(255) NOT NULL,
  target     VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
