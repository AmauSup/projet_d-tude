-- MIGRATION : Ajout des champs/tables manquants pour Althea Systems

-- 1. Utilisateurs : vérification email, reset password
ALTER TABLE utilisateur ADD COLUMN email_verified_at TIMESTAMP NULL;

CREATE TABLE email_verification_token (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  FOREIGN KEY (user_id) REFERENCES utilisateur(id)
);

CREATE TABLE password_reset_token (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  FOREIGN KEY (user_id) REFERENCES utilisateur(id)
);

-- 2. Catégories : image, description, ordre
ALTER TABLE category ADD COLUMN image_url VARCHAR(255);
ALTER TABLE category ADD COLUMN description TEXT;
ALTER TABLE category ADD COLUMN order_index INT DEFAULT 0;

-- 3. Produits : priorité, suppression douce
ALTER TABLE produit ADD COLUMN priority INT DEFAULT 0;
ALTER TABLE produit ADD COLUMN deleted_at TIMESTAMP NULL;

-- 4. Carousel
CREATE TABLE carousel (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255),
  image_url VARCHAR(255),
  order_index INT,
  category_id INT,
  FOREIGN KEY (category_id) REFERENCES category(id)
);

-- 5. Homepage content
CREATE TABLE homepage_content (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fixed_message TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 6. Top produits
CREATE TABLE top_product (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  order_index INT DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES produit(id)
);

-- 7. Contact message
CREATE TABLE contact_message (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  email VARCHAR(150),
  subject VARCHAR(255),
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES utilisateur(id)
);

-- 8. Chatbot
CREATE TABLE chatbot_conversation (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50),
  FOREIGN KEY (user_id) REFERENCES utilisateur(id)
);

CREATE TABLE chatbot_message (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT NOT NULL,
  sender VARCHAR(50),
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES chatbot_conversation(id)
);

-- 9. Paiement/transaction
CREATE TABLE payment_transaction (
  id INT AUTO_INCREMENT PRIMARY KEY,
  achat_id INT NOT NULL,
  status VARCHAR(50),
  amount DECIMAL(12,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (achat_id) REFERENCES achat(id)
);

-- 10. Invoice
CREATE TABLE invoice (
  id INT AUTO_INCREMENT PRIMARY KEY,
  achat_id INT NOT NULL,
  pdf_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (achat_id) REFERENCES achat(id)
);

-- 11. Admin log
CREATE TABLE admin_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL,
  action VARCHAR(255),
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES utilisateur(id)
);

-- 12. Index utiles
CREATE INDEX idx_produit_priority ON produit(priority);
CREATE INDEX idx_produit_deleted_at ON produit(deleted_at);
CREATE INDEX idx_category_order_index ON category(order_index);
CREATE INDEX idx_carousel_order_index ON carousel(order_index);
CREATE INDEX idx_top_product_order_index ON top_product(order_index);
CREATE INDEX idx_achat_date ON achat(date);
CREATE INDEX idx_utilisateur_email_verified_at ON utilisateur(email_verified_at);
