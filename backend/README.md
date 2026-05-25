# Backend Express — Althea Systems

API Express + PostgreSQL (Neon) pour l'application e-commerce médicale Althea.

## Prérequis

- Node.js 18+
- Accès à une base PostgreSQL (Neon ou locale)

## Installation

```bash
cd backend
npm install
```

## Variables d'environnement

Copier `.env.example` vers `.env` et renseigner les valeurs :

```bash
cp .env.example .env
```

| Variable         | Description                              | Exemple                          |
|------------------|------------------------------------------|----------------------------------|
| `DATABASE_URL`   | URL de connexion PostgreSQL              | `postgresql://user:pwd@host/db`  |
| `JWT_SECRET`     | Secret pour signer les JWT               | `mon-secret-tres-long`           |
| `JWT_EXPIRES`    | Durée de validité des tokens             | `1d`                             |
| `PORT`           | Port d'écoute du serveur                 | `3001`                           |
| `FRONTEND_URL`   | URL du frontend (CORS + liens email)     | `http://localhost:5173`          |
| `NODE_ENV`       | Environnement (`development`/`production`)| `development`                   |

## Migration de la base de données

Appliquer le schéma initial sur Neon (ou tout client PostgreSQL) :

```bash
# Via psql
psql "$DATABASE_URL" -f database/003_postgres_schema.sql

# Via le client Neon (interface web) : importer le fichier SQL
```

Les migrations auto au démarrage (ALTER TABLE IF NOT EXISTS) sont appliquées automatiquement à chaque `npm start`.

## Seed des données de test

```bash
node data/seedData.js
node data/seedUsers.js
```

Comptes créés par le seed :
- **Admin** : `admin@althea.medical` / `Admin123!`
- **Client** : `lina.martin@cabinet-demo.fr` / `Password123!`

## Démarrage

```bash
# Développement (avec rechargement automatique si nodemon est installé)
npm run dev

# Production
npm start
```

L'API démarre sur `http://localhost:3001`.

## Scripts disponibles

| Commande      | Action                          |
|---------------|---------------------------------|
| `npm start`   | Lance le serveur Express        |
| `npm run dev` | Lance avec nodemon (hot-reload) |

## Endpoints PostgreSQL (`/api/pg/`)

### Auth
| Méthode | Route                          | Description                    |
|---------|--------------------------------|--------------------------------|
| POST    | `/api/pg/auth/register`        | Inscription                    |
| POST    | `/api/pg/auth/login`           | Connexion                      |
| POST    | `/api/pg/auth/logout`          | Déconnexion                    |
| GET     | `/api/pg/auth/profile`         | Profil utilisateur (auth)      |
| PUT     | `/api/pg/auth/profile`         | Modifier le profil             |
| PUT     | `/api/pg/auth/password`        | Changer le mot de passe        |
| POST    | `/api/pg/auth/forgot-password` | Demande reset mot de passe     |
| POST    | `/api/pg/auth/reset-password`  | Réinitialiser le mot de passe  |
| GET     | `/api/pg/auth/addresses`       | Lister les adresses            |
| POST    | `/api/pg/auth/addresses`       | Créer une adresse              |
| PUT     | `/api/pg/auth/addresses/:id`   | Modifier une adresse           |
| DELETE  | `/api/pg/auth/addresses/:id`   | Supprimer une adresse          |

### Storefront (public)
| Méthode | Route                  | Description                          |
|---------|------------------------|--------------------------------------|
| GET     | `/api/pg/storefront`   | Produits + catégories + homeContent  |
| GET     | `/api/pg/products`     | Liste des produits                   |

### Commandes
| Méthode | Route              | Description                      |
|---------|--------------------|----------------------------------|
| GET     | `/api/pg/orders`   | Commandes de l'utilisateur (auth)|
| POST    | `/api/pg/orders`   | Créer une commande (auth)        |

### Support
| Méthode | Route                       | Description          |
|---------|-----------------------------|----------------------|
| POST    | `/api/pg/support/contact`   | Envoyer un message   |

### Admin (requiert `is_admin = true`)
| Méthode | Route                              | Description                    |
|---------|------------------------------------|--------------------------------|
| GET     | `/api/pg/admin/stats`              | Statistiques dashboard         |
| GET/POST| `/api/pg/admin/products`           | Liste / créer un produit       |
| PUT/DEL | `/api/pg/admin/products/:id`       | Modifier / supprimer           |
| GET     | `/api/pg/admin/orders`             | Toutes les commandes           |
| PUT     | `/api/pg/admin/orders/:id/status`  | Changer le statut              |
| GET     | `/api/pg/admin/users`              | Liste des utilisateurs         |
| POST    | `/api/pg/admin/users`              | Créer un utilisateur           |
| PUT     | `/api/pg/admin/users/:id`          | Modifier un utilisateur        |
| PATCH   | `/api/pg/admin/users/:id/delete`   | Désactiver un utilisateur      |
| GET/POST/PUT/DEL | `/api/pg/admin/categories/:id` | CRUD catégories         |
| GET/PUT | `/api/pg/admin/homepage`           | Contenu page d'accueil         |
| GET/POST/PUT/DEL | `/api/pg/admin/carousel/:id` | CRUD carrousel          |
| GET     | `/api/pg/admin/messages`           | Messages de contact            |
| PATCH   | `/api/pg/admin/messages/:id`       | Mettre à jour le statut        |
| GET     | `/api/pg/admin/logs`               | Logs des actions admin         |
| GET/PUT | `/api/pg/admin/settings`           | Paramètres du site             |
