# Base de données — Althea Systems

Ce dossier contient les migrations SQL pour PostgreSQL (Neon ou instance locale).

## Ordre d'exécution des migrations

Les migrations sont **idempotentes** (`IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`).  
Sur une base vierge, exécuter dans cet ordre :

```bash
# 1. Schéma complet (tables, index, données initiales)
psql "$DATABASE_URL" -f database/003_postgres_schema.sql

# 2. Corrections incrémentales (colonnes manquantes, contraintes)
psql "$DATABASE_URL" -f database/004_incremental_migration.sql

# 3. Consolidation (slug produit, user_address, admin_log, payment_transaction)
psql "$DATABASE_URL" -f database/005_consolidation.sql
```

Sur une base déjà créée (migration partielle), il suffit de jouer uniquement la 005.

## Fichiers

| Fichier | Description |
|---------|-------------|
| `001_initial_schema.sql` | Schéma initial MySQL/MariaDB (legacy, ne pas utiliser) |
| `002_althea_additions.sql` | Ajouts MySQL legacy (legacy, ne pas utiliser) |
| `003_postgres_schema.sql` | Schéma PostgreSQL complet — point de départ |
| `004_incremental_migration.sql` | Corrections de colonnes manquantes |
| `005_consolidation.sql` | **Obligatoire** — corrige slug produit, crée user_address, aligne admin_log |
| `schema.dbml` | Modèle relationnel pour dbdiagram.io |

## Tables principales

| Table | Description |
|-------|-------------|
| `users` | Comptes utilisateurs (clients + admins) |
| `category` | Catégories de produits |
| `product` | Produits avec soft-delete |
| `product_translation` | Traductions des produits (FR/EN/AR) |
| `user_address` | Carnet d'adresses utilisateurs |
| `payment_method` | Méthodes de paiement (last4 uniquement) |
| `orders` | Commandes avec adresse de facturation en JSONB |
| `order_item` | Lignes de commande |
| `payment_transaction` | Transactions de paiement (simulées) |
| `invoice` | Factures PDF |
| `homepage_content` | Message fixe de la page d'accueil |
| `carousel` | Slides du carrousel d'accueil |
| `contact_message` | Messages du formulaire de contact |
| `chatbot_conversation` | Sessions chatbot |
| `chatbot_message` | Messages chatbot |
| `admin_log` | Journal des actions administrateurs |
| `email_verification_token` | Tokens de confirmation d'email |
| `password_reset_token` | Tokens de réinitialisation de mot de passe |
| `site_settings` | Paramètres clé-valeur |

## Variables d'environnement (backend/.env)

```env
DATABASE_URL=postgres://user:password@host/dbname?sslmode=require
JWT_SECRET=votre-secret-jwt-64-chars-minimum
JWT_EXPIRES=1d
FRONTEND_URL=http://localhost:5173
ADMIN_URL=http://localhost:5174
PORT=3001
NODE_ENV=development
# ENABLE_LEGACY_ROUTES=true  # décommenter pour activer les routes db.json legacy
```

## Données de test

```bash
# Seed PostgreSQL complet (recommandé) — produits réels + images Unsplash
node backend/data/seedPostgres.js

# Comptes créés :
#   admin@althea.medical        / Admin123!  (administrateur)
#   dr.martin@cabinet-medical.fr / Client123! (client)

# Anciens seeds legacy (db.json, ne peupler pas PostgreSQL) :
# node backend/data/seedData.js
# node backend/data/seedUsers.js
```
