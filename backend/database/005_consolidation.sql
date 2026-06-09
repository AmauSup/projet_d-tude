-- =============================================================
-- MIGRATION 005 — Consolidation et corrections de schéma
-- Corrige les incohérences entre 003/004 et le code serveur.
-- Idempotent : IF NOT EXISTS / ADD COLUMN IF NOT EXISTS
-- =============================================================

-- -------------------------
-- TABLE product — colonne slug manquante dans 003/004
-- -------------------------
ALTER TABLE product ADD COLUMN IF NOT EXISTS slug     VARCHAR(255);
ALTER TABLE product ADD COLUMN IF NOT EXISTS featured INT NOT NULL DEFAULT 0;
ALTER TABLE product ADD COLUMN IF NOT EXISTS priority INT NOT NULL DEFAULT 0;
ALTER TABLE product ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Générer un slug par défaut depuis l'id si absent
UPDATE product
SET slug = 'product-' || id
WHERE slug IS NULL;

CREATE INDEX IF NOT EXISTS idx_product_slug ON product(slug);
CREATE INDEX IF NOT EXISTS idx_product_featured ON product(featured);

-- -------------------------
-- TABLE user_address — créée au runtime dans server.js, absente des migrations
-- -------------------------
CREATE TABLE IF NOT EXISTS user_address (
  id          SERIAL PRIMARY KEY,
  user_id     INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label       VARCHAR(100),
  type        VARCHAR(20)  NOT NULL DEFAULT 'shipping',
  first_name  VARCHAR(100),
  last_name   VARCHAR(100),
  address1    VARCHAR(255) NOT NULL DEFAULT '',
  address2    VARCHAR(255),
  city        VARCHAR(100) NOT NULL DEFAULT '',
  postal_code VARCHAR(20),
  region      VARCHAR(100),
  country     VARCHAR(100) NOT NULL DEFAULT 'France',
  phone       VARCHAR(30),
  email       VARCHAR(255),
  is_default  BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_address_user ON user_address(user_id);

-- -------------------------
-- TABLE admin_log — 003 a entity/entity_id/details, server.js utilise target
-- On ajoute target si absent (sans supprimer les colonnes legacy)
-- -------------------------
ALTER TABLE admin_log ADD COLUMN IF NOT EXISTS target     VARCHAR(255);
ALTER TABLE admin_log ADD COLUMN IF NOT EXISTS action     VARCHAR(255);
-- Si admin_id est NOT NULL dans 003 mais le backend peut passer NULL, on relaxe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_log' AND column_name = 'admin_id'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE admin_log ALTER COLUMN admin_id DROP NOT NULL;
  END IF;
END $$;

-- -------------------------
-- TABLE contact_message — harmoniser le statut par défaut sur 'open'
-- -------------------------
ALTER TABLE contact_message ALTER COLUMN status SET DEFAULT 'open';

-- -------------------------
-- TABLE orders — s'assurer que billing_address est bien JSONB
-- (004 ajoute TEXT si absent, mais 003 l'a en JSONB : on ne touche pas si JSONB)
-- -------------------------
DO $$
DECLARE
  col_type text;
BEGIN
  SELECT data_type INTO col_type
  FROM information_schema.columns
  WHERE table_name = 'orders' AND column_name = 'billing_address';

  IF col_type = 'text' THEN
    -- Convertir TEXT → JSONB en préservant les données
    ALTER TABLE orders ALTER COLUMN billing_address TYPE JSONB
      USING CASE
        WHEN billing_address IS NULL THEN NULL
        WHEN billing_address ~ '^[\[{]' THEN billing_address::JSONB
        ELSE to_jsonb(billing_address)
      END;
  END IF;
END $$;

-- -------------------------
-- TABLE payment_transaction — aligner les colonnes avec server.js
-- server.js utilise : order_id, provider, status, amount, reference
-- -------------------------
ALTER TABLE payment_transaction ADD COLUMN IF NOT EXISTS reference VARCHAR(255);
ALTER TABLE payment_transaction ADD COLUMN IF NOT EXISTS currency  CHAR(3) NOT NULL DEFAULT 'EUR';

-- -------------------------
-- TABLE carousel — s'assurer que updated_at existe (absent de 004)
-- -------------------------
ALTER TABLE carousel ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Données initiales homepage si absentes
INSERT INTO homepage_content (fixed_message)
SELECT 'Bienvenue sur Althea Systems — votre partenaire en matériel médical de pointe.'
WHERE NOT EXISTS (SELECT 1 FROM homepage_content);

-- -------------------------
-- Index supplémentaires pour les requêtes admin stats
-- -------------------------
CREATE INDEX IF NOT EXISTS idx_orders_created_month ON orders(DATE_TRUNC('day', created_at));
CREATE INDEX IF NOT EXISTS idx_order_item_product_order ON order_item(product_id, order_id);
