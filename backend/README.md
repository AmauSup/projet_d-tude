# README - Backend Java pour Althea

## 📋 Description

Backend Java/Spring Boot pour l'application e-commerce médicale **Althea**. Ce backend est conçu pour supporter le frontend React existant sans aucune modification.

## 🚀 Démarrage rapide

### Prérequis
- Java 17+
- Maven 3.6+

### Installation et lancement

1. **Installer les dépendances Maven**
```bash
cd backend-java
mvn clean install
```

2. **Lancer l'application**
```bash
mvn spring-boot:run
```

L'application démarre sur `http://localhost:8080/api`

### Base de données
- **Type** : H2 (en mémoire)
- **Console H2** : http://localhost:8080/api/h2-console
  - URL JDBC : `jdbc:h2:mem:altheadb`
  - Utilisateur : `sa`
  - Mot de passe : (vide)

## 📚 Endpoints API

### Produits
- `GET /api/products` - Récupérer tous les produits
- `GET /api/products/:slug` - Récupérer un produit par slug
- `GET /api/products/category/:categoryId` - Récupérer les produits d'une catégorie

### Catégories
- `GET /api/categories` - Récupérer toutes les catégories

### Authentification
- `POST /api/auth/login` - Connexion
  ```json
  { "email": "admin@althea.com", "password": "admin123" }
  ```
- `POST /api/auth/register` - Inscription
- `POST /api/auth/forgot-password` - Demande de réinitialisation
- `POST /api/auth/logout` - Déconnexion

### Commandes
- `GET /api/orders?userId=:userId` - Récupérer les commandes de l'utilisateur

### Compte
- `PUT /api/account/profile?userId=:userId` - Mettre à jour le profil
- `GET /api/account/addresses?userId=:userId` - Récupérer les adresses
- `PUT /api/account/addresses?userId=:userId` - Mettre à jour les adresses

### Paiement
- `POST /api/checkout/validate` - Valider avant le paiement
- `POST /api/checkout/payment-intent` - Créer une intention de paiement

## 🔐 Configuration CORS

Le backend accepte les requêtes en provenance de :
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000` (alt. dev server)

Modifiez [AltheaApplication.java](./src/main/java/com/althea/AltheaApplication.java) pour changer les origines autorisées.

## 📦 Structure du projet

```
backend-java/
├── pom.xml
├── src/
│   ├── main/
│   │   ├── java/com/althea/
│   │   │   ├── AltheaApplication.java
│   │   │   ├── config/
│   │   │   │   └── DataInitializer.java
│   │   │   ├── controller/
│   │   │   │   ├── ProductController.java
│   │   │   │   ├── CategoryController.java
│   │   │   │   ├── AuthController.java
│   │   │   │   ├── OrderController.java
│   │   │   │   ├── AccountController.java
│   │   │   │   └── CheckoutController.java
│   │   │   ├── service/
│   │   │   │   ├── ProductService.java
│   │   │   │   ├── CategoryService.java
│   │   │   │   ├── AuthService.java
│   │   │   │   ├── OrderService.java
│   │   │   │   ├── AccountService.java
│   │   │   │   └── JwtService.java
│   │   │   ├── model/
│   │   │   │   ├── Category.java
│   │   │   │   ├── Product.java
│   │   │   │   ├── User.java
│   │   │   │   ├── Order.java
│   │   │   │   ├── OrderLine.java
│   │   │   │   └── Address.java
│   │   │   ├── dto/
│   │   │   │   ├── ProductDTO.java
│   │   │   │   ├── CategoryDTO.java
│   │   │   │   ├── OrderDTO.java
│   │   │   │   ├── OrderLineDTO.java
│   │   │   │   ├── AddressDTO.java
│   │   │   │   ├── AuthRequest.java
│   │   │   │   ├── AuthResponse.java
│   │   │   │   └── MessageResponse.java
│   │   │   └── repository/
│   │   │       ├── ProductRepository.java
│   │   │       ├── CategoryRepository.java
│   │   │       ├── UserRepository.java
│   │   │       ├── OrderRepository.java
│   │   │       └── AddressRepository.java
│   │   └── resources/
│   │       └── application.yml
```

## 🔑 Utilisateurs de test

### Admin
- Email: `admin@althea.com`
- Mot de passe: `admin123`

### Client
- Email: `customer@example.com`
- Mot de passe: `password123`

## ⚠️ Notes importantes pour la production

1. **Authentification** : Le mot de passe est actuellement en clair. Utilisez **BCrypt** pour hasher les mots de passe.
   ```java
   import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
   ```

2. **Clé JWT** : Générez une clé de 256 bits pour la production:
   ```bash
   openssl rand -base64 32
   ```
   Mettez-la dans `application.yml` sous `app.jwt.secret`

3. **Base de données** : Remplacez H2 par PostgreSQL, MySQL, etc. dans `pom.xml` et `application.yml`

4. **Email** : Implémentez l'envoi d'emails pour :
   - Vérification d'email
   - Réinitialisation de mot de passe
   - Confirmations de commande

5. **Paiement** : Intégrez Stripe, PayPal ou autre fournisseur dans `CheckoutController`

## 🤝 Intégration avec le frontend

Le frontend React est pré-configuré pour appeler ce backend. Les endpoints sont documentés dans les fichiers `services/` du frontend :
- `productService.js`
- `categoryService.js`
- `authService.js`
- `orderService.js`
- `accountService.js`
- `checkoutService.js`

## 📝 Licence

Propriétaire

---

**Créé avec Spring Boot 3.2 et Java 17**
