# Sprint 1 — Infrastructure & Authentification

**Période :** Semaines 1–2  
**Statut :** Terminé

## Objectifs du sprint

Mettre en place l'infrastructure technique du projet et implémenter les fondations de l'authentification utilisateur.

## Travaux réalisés

### Architecture technique
- Initialisation du monorepo `frontend/` (Vite + React 18) et `backend/` (Node.js + Express)
- Configuration de la base de données PostgreSQL (Neon Cloud)
- Mise en place du schéma initial (`003_postgres_schema.sql`) : tables `users`, `product`, `category`, `orders`, `payment_method`
- Configuration des variables d'environnement (`.env`) : `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`
- Configuration CORS et en-têtes de sécurité HTTP (`X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`)

### Design system
- Création du design system global (`frontend/styles/global.css`) : variables CSS, composants `.btn`, `.card`, `.notice`, `.input`, `.badge`, `.panel`
- Choix d'une palette médicale (bleu `#0ea5e9`, fond `#f8fafc`)
- Mise en place du thème sombre (`data-theme="dark"`) via `ThemeContext`
- Composants de layout : `Header`, `Footer`, `Breadcrumbs`

### Authentification
- Endpoint `POST /api/pg/auth/register` avec validation mot de passe (8 car., maj., min., chiffre, spécial)
- Endpoint `POST /api/pg/auth/login` avec JWT (`jsonwebtoken`)
- Hachage des mots de passe avec `bcryptjs` (facteur 12)
- Middleware `authenticateToken` réutilisable
- Rate limiting in-memory sur les endpoints sensibles (20 req/15 min)
- Pages React : `Register.jsx`, `Login.jsx`

## Difficultés rencontrées
- Configuration SSL pour Neon (ajout de `rejectUnauthorized: false` en production)
- Paramétrage du HashRouter React nécessaire pour le déploiement statique

## Indicateurs
- Endpoints implémentés : 4
- Pages front créées : 5 (Home, Register, Login, NotFound, Layout)
- Tests manuels : inscription, connexion, déconnexion
