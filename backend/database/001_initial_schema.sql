CREATE TABLE langue (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL
);

CREATE TABLE category (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL
);

CREATE TABLE method_paiement (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category VARCHAR(100) NOT NULL
);

CREATE TABLE produit (
  id INT AUTO_INCREMENT PRIMARY KEY,
  prix DOUBLE NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  image JSON,
  category_id INT NOT NULL,
  date_ajout TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  date_modif TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_produit_category_id (category_id)
);

CREATE TABLE product_translation (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  nom VARCHAR(255) NOT NULL,
  description TEXT,
  caracteristique TEXT,
  langue_id INT NOT NULL,
  INDEX idx_product_translation_product_id (product_id),
  INDEX idx_product_translation_langue_id (langue_id),
  UNIQUE KEY uq_product_translation_product_langue (product_id, langue_id)
);

CREATE TABLE adresse_facturation (
  id_adresse INT AUTO_INCREMENT PRIMARY KEY,
  id_user INT,
  nom VARCHAR(100),
  prenom VARCHAR(100),
  adresse1 VARCHAR(255),
  adresse2 VARCHAR(255),
  telephone VARCHAR(30),
  code_postal VARCHAR(20),
  ville VARCHAR(100),
  region VARCHAR(100),
  INDEX idx_adresse_facturation_id_user (id_user)
);

CREATE TABLE utilisateur (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  mail VARCHAR(150) NOT NULL UNIQUE,
  mot_de_passe TEXT NOT NULL,
  id_adresse INT,
  achat_list INT,
  methode_paiement_id INT,
  INDEX idx_utilisateur_id_adresse (id_adresse),
  INDEX idx_utilisateur_achat_list (achat_list),
  INDEX idx_utilisateur_methode_paiement_id (methode_paiement_id)
);

CREATE TABLE achat (
  id_achat INT AUTO_INCREMENT PRIMARY KEY,
  id_user INT NOT NULL,
  date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  id_produit INT,
  methode_paiement INT,
  sum_price_achat DECIMAL(12, 2),
  INDEX idx_achat_id_user (id_user),
  INDEX idx_achat_id_produit (id_produit),
  INDEX idx_achat_methode_paiement (methode_paiement)
);

CREATE TABLE product_quantity (
  id_achat INT NOT NULL,
  id_produit INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  sum_price FLOAT,
  statut_commande VARCHAR(100),
  PRIMARY KEY (id_achat, id_produit),
  INDEX idx_product_quantity_id_produit (id_produit)
);

ALTER TABLE produit
  ADD CONSTRAINT fk_produit_category
  FOREIGN KEY (category_id) REFERENCES category(id);

ALTER TABLE product_translation
  ADD CONSTRAINT fk_product_translation_product
  FOREIGN KEY (product_id) REFERENCES produit(id),
  ADD CONSTRAINT fk_product_translation_langue
  FOREIGN KEY (langue_id) REFERENCES langue(id);

ALTER TABLE adresse_facturation
  ADD CONSTRAINT fk_adresse_facturation_user
  FOREIGN KEY (id_user) REFERENCES utilisateur(id);

ALTER TABLE utilisateur
  ADD CONSTRAINT fk_utilisateur_adresse
  FOREIGN KEY (id_adresse) REFERENCES adresse_facturation(id_adresse),
  ADD CONSTRAINT fk_utilisateur_methode_paiement
  FOREIGN KEY (methode_paiement_id) REFERENCES method_paiement(id),
  ADD CONSTRAINT fk_utilisateur_achat_list
  FOREIGN KEY (achat_list) REFERENCES achat(id_achat);

ALTER TABLE achat
  ADD CONSTRAINT fk_achat_user
  FOREIGN KEY (id_user) REFERENCES utilisateur(id),
  ADD CONSTRAINT fk_achat_produit
  FOREIGN KEY (id_produit) REFERENCES produit(id),
  ADD CONSTRAINT fk_achat_methode_paiement
  FOREIGN KEY (methode_paiement) REFERENCES method_paiement(id);

ALTER TABLE product_quantity
  ADD CONSTRAINT fk_product_quantity_achat
  FOREIGN KEY (id_achat) REFERENCES achat(id_achat),
  ADD CONSTRAINT fk_product_quantity_produit
  FOREIGN KEY (id_produit) REFERENCES produit(id);
