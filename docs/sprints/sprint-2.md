# Sprint 2 — Catalogue, Panier & Commandes

**Période :** Semaines 3–4  
**Statut :** Terminé

## Objectifs du sprint

Implémenter le cœur fonctionnel e-commerce : catalogue produits, recherche avancée, panier, tunnel d'achat et suivi de commandes.

## Travaux réalisés

### Catalogue & Recherche
- Endpoint `GET /api/pg/products` avec support de la pagination et du filtrage
- Endpoint `GET /api/pg/storefront` (données agrégées : produits + catégories + contenu home en une requête)
- Page `Category.jsx` : liste des produits par catégorie avec tri
- Page `Product.jsx` : fiche produit complète (galerie, description, caractéristiques techniques, produits similaires)
- Page `Search.jsx` : recherche multi-critères avec algorithme fuzzy (distance de Levenshtein)
- Tri produits : disponibilité → rang de priorité → ordre alphabétique

### Panier
- `Cart.jsx` : gestion du panier (ajout, modification de quantité, suppression)
- Persistance du panier en `localStorage` (`althea-cart`)
- Calcul automatique : sous-total, TVA 20%, remise 5% dès 3 000 €
- Purge des données mock au premier chargement (migration IDs `prod-*`)

### Tunnel d'achat
- `Checkout.jsx` : saisie adresse de facturation + données de carte
- `Confirmation.jsx` : récapitulatif commande post-achat
- `OrderHistory.jsx` : historique des commandes par année avec filtres (statut, recherche)
- Endpoint `POST /api/pg/orders` (création commande) + `GET /api/pg/orders` (récupération)
- Génération de factures PDF avec `pdfkit` (`GET /api/pg/orders/:id/invoice`)

### Services frontend
- `storefrontService.js` : chargement initial des données catalogue
- `checkoutService.js` : passage de commande via API
- `apiClient.js` : client HTTP centralisé avec gestion du token JWT

## Difficultés rencontrées
- Synchronisation panier invité / compte connecté (purge sélective des IDs mock)
- Performance de la recherche fuzzy sur des catalogues larges → optimisation avec early-exit

## Indicateurs
- Endpoints implémentés : 8 nouveaux
- Pages front créées : 6 (Category, Product, Search, Cart, Checkout, Confirmation, OrderHistory)
- Fonctionnalité bout-en-bout : parcours d'achat complet testé manuellement
