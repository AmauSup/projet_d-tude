# Sprint 3 — Espace Compte & Interface Administration

**Période :** Semaines 5–6  
**Statut :** Terminé

## Objectifs du sprint

Implémenter l'espace compte utilisateur complet (profil, adresses, paiements) et l'interface d'administration backoffice.

## Travaux réalisés

### Espace compte utilisateur
- `Account.jsx` : tableau de bord avec navigation (paramètres, adresses, paiements, commandes)
- `AccountSettings.jsx` : modification du profil, changement d'email, changement de mot de passe
- `AccountAddresses.jsx` : gestion des adresses de livraison/facturation (CRUD)
- `AccountPayments.jsx` : gestion des méthodes de paiement enregistrées
- Endpoints dédiés : `PUT /api/pg/auth/profile`, `PUT /api/pg/auth/password`, `POST/PUT/DELETE /api/pg/auth/addresses`, `POST/DELETE /api/pg/auth/payment-methods`

### Authentification avancée
- Vérification d'e-mail : envoi de lien par SMTP (Nodemailer), table `email_verification_token`
- Réinitialisation de mot de passe : `POST /api/pg/auth/forgot-password`, `POST /api/pg/auth/reset-password`
- Double authentification admin (2FA OTP) : `POST /api/pg/auth/verify-2fa`
- Page `ResendVerification.jsx` : renvoi du lien de confirmation
- Pages `ForgotPassword.jsx`, `ResetPassword.jsx`, `TwoFAVerify.jsx`

### Interface d'administration (backoffice)
- `AdminLayout.jsx` + routes imbriquées sous `/admin`
- `AdminDashboard.jsx` : statistiques en temps réel (commandes, chiffre d'affaires, nouveaux utilisateurs, stocks)
- `AdminProducts.jsx` : gestion des produits (CRUD, upload image, stock, disponibilité)
- `AdminCategories.jsx` : gestion des catégories et de leur ordre d'affichage
- `AdminOrders.jsx` : suivi et mise à jour des statuts de commandes
- `AdminUsers.jsx` : gestion des comptes utilisateurs
- `AdminSupport.jsx` : suivi des tickets de support/chatbot
- `Admin.jsx` (content/home) : gestion de la page d'accueil (carousel, message fixe, produits vedettes)
- Journal d'administration (`admin_log`) : traçabilité des actions
- Protection des routes admin : middleware `requireAdmin` + 2FA obligatoire

### Contenu statique
- Pages `TermsPage.jsx` (CGU), `LegalPage.jsx` (mentions légales), `AboutPage.jsx`, `Contact.jsx`

## Difficultés rencontrées
- Encodage du JWT et propriétés `is_admin` : distinction admin/client via le token
- Double invocation React StrictMode sur les effets : résolu avec `useRef` guard
- HashRouter incompatible avec les liens serveur générés sans `/#/` prefix → corrigé en sprint 4

## Indicateurs
- Endpoints implémentés : 15 nouveaux
- Pages front créées : 12 (Account, Settings, Addresses, Payments + toutes les pages Admin)
- Couverture fonctionnelle admin : 100% des exigences CRUD du cahier des charges
