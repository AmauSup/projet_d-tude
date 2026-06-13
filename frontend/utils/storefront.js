// Formate un montant en centimes en chaîne lisible selon la locale française.
// Utilise l'API Intl.NumberFormat pour le symbole monétaire et les séparateurs.
// Paramètres :
//   cents (number) — montant en centimes entiers (ex: 24900 → "249,00 €")
// Retourne :
//   (string) — montant formaté (ex: "1 249,00 €")
export function formatPrice(cents) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

// Calcule la distance de Levenshtein entre deux chaînes (nombre de caractères à modifier
// pour transformer source en target). Utilisée pour la recherche floue (tolérance aux fautes).
// L'algorithme remplit une matrice (rows × columns) où chaque cellule représente
// le coût minimal pour transformer le préfixe correspondant.
// Paramètres :
//   source (string) — chaîne de référence
//   target (string) — chaîne cible
// Retourne :
//   (number) — distance d'édition (0 = identiques, 1 = 1 caractère différent, etc.)
function levenshteinDistance(source, target) {
  const sourceValue = source.toLowerCase();   // Insensible à la casse
  const targetValue = target.toLowerCase();
  const rows = sourceValue.length + 1;         // +1 pour la ligne vide (chaîne vide → n insertions)
  const columns = targetValue.length + 1;
  // Matrice initialisée à 0, remplie ligne par ligne
  const matrix = Array.from({ length: rows }, () => new Array(columns).fill(0));

  // Initialise la première colonne : transformer sourceValue[0..row] en '' coûte `row` suppressions
  for (let row = 0; row < rows; row += 1) {
    matrix[row][0] = row;
  }

  // Initialise la première ligne : transformer '' en targetValue[0..col] coûte `col` insertions
  for (let column = 0; column < columns; column += 1) {
    matrix[0][column] = column;
  }

  // Remplit le reste : pour chaque paire de caractères, le coût est :
  //   0 si les caractères sont identiques, 1 sinon (substitution)
  // On prend le minimum entre suppression, insertion et substitution.
  for (let row = 1; row < rows; row += 1) {
    for (let column = 1; column < columns; column += 1) {
      const cost = sourceValue[row - 1] === targetValue[column - 1] ? 0 : 1;
      matrix[row][column] = Math.min(
        matrix[row - 1][column] + 1,       // suppression dans source
        matrix[row][column - 1] + 1,       // insertion dans source
        matrix[row - 1][column - 1] + cost, // substitution
      );
    }
  }

  // La cellule en bas à droite contient la distance totale
  return matrix[rows - 1][columns - 1];
}

// Trie les produits d'une catégorie selon les règles métier Althea :
//   1. Produits en stock avant les produits en rupture (disponibilité)
//   2. Produits avec une priorité (priorityRank > 0) avant les autres
//   3. Par rang de priorité croissant (1 = plus prioritaire)
//   4. Alphabétique en français comme critère final de départage
// Paramètres :
//   products (array) — liste de produits normalisés (voir storefrontService.js)
// Retourne :
//   (array) — nouveau tableau trié (ne modifie pas l'original grâce au spread [...])
export function sortProductsForCategory(products) {
  return [...products].sort((left, right) => {
    const leftAvailable = left.availableStock > 0;
    const rightAvailable = right.availableStock > 0;

    // Critère 1 : disponibilité (true > false → on soustrait pour mettre true en premier)
    if (leftAvailable !== rightAvailable) {
      return Number(rightAvailable) - Number(leftAvailable);
    }

    const leftPriority = left.priorityRank > 0;
    const rightPriority = right.priorityRank > 0;

    // Critère 2 : présence d'une priorité
    if (leftPriority !== rightPriority) {
      return Number(rightPriority) - Number(leftPriority);
    }

    // Critère 3 : rang de priorité (le plus petit rang arrive en premier)
    // MAX_SAFE_INTEGER est utilisé pour que les produits sans priorité (0) aillent en dernier
    if (left.priorityRank !== right.priorityRank) {
      const leftRank = left.priorityRank || Number.MAX_SAFE_INTEGER;
      const rightRank = right.priorityRank || Number.MAX_SAFE_INTEGER;
      return leftRank - rightRank;
    }

    // Critère 4 : ordre alphabétique français (gère les accents correctement)
    return left.name.localeCompare(right.name, 'fr');
  });
}

// Construit la liste des produits "similaires" à afficher sur une page produit.
// Filtre les produits de la même catégorie (hors le produit courant), les trie,
// et limite le résultat.
// Paramètres :
//   products (array)  — tous les produits du catalogue
//   product  (object) — produit dont on cherche les similaires
//   limit    (number) — nombre maximum de produits retournés (défaut 6)
// Retourne :
//   (array) — tableau de produits similaires triés, max `limit` éléments
export function buildRelatedProducts(products, product, limit = 6) {
  return sortProductsForCategory(
    products.filter(
      (candidate) => candidate.categoryId === product.categoryId && candidate.id !== product.id,
    ),
  ).slice(0, limit);
}

// Calcule un score de pertinence entre une requête et un texte.
// Score bas = meilleure correspondance. 99 = aucune correspondance.
// Hiérarchie des scores (du plus pertinent au moins pertinent) :
//   1 — correspondance exacte totale
//   2 — tous les mots de la requête sont dans le texte
//   3 — préfixe exact
//   4 — inclusion partielle
//   5 — distance Levenshtein ≤ 1 (une faute de frappe)
//   6 — au moins un mot de la requête a distance ≤ 1 avec un mot du texte
//   7 — distance ≤ 2 (deux fautes de frappe)
//  99 — aucune correspondance
// Paramètres :
//   query (string) — terme de recherche saisi par l'utilisateur
//   text  (string) — texte du produit à tester (nom, description, etc.)
// Retourne :
//   (number) — score de 1 (parfait) à 99 (aucun match)
function getSearchRank(query, text) {
  if (!query) return 0;

  const normalizedQuery = query.trim().toLowerCase();
  const normalizedText = text.toLowerCase();
  const queryWords = normalizedQuery.split(/\s+/).filter(Boolean);  // Mots de la requête
  const textWords = normalizedText.split(/\s+/).filter(Boolean);    // Mots du texte

  if (normalizedText === normalizedQuery) return 1;
  if (queryWords.every((qw) => normalizedText.includes(qw))) return 2;
  if (normalizedText.startsWith(normalizedQuery)) return 3;
  if (normalizedText.includes(normalizedQuery)) return 4;

  // Levenshtein sur le texte complet ou sur chaque mot du texte
  const dist1 = levenshteinDistance(normalizedText, normalizedQuery);
  if (dist1 <= 1) return 5;
  if (textWords.some((tw) => levenshteinDistance(tw, normalizedQuery) <= 1)) return 5;

  const fuzzy1 = queryWords.some((qw) =>
    textWords.some((tw) => levenshteinDistance(tw, qw) <= 1),
  );
  if (fuzzy1) return 6;

  const dist2 = levenshteinDistance(normalizedText, normalizedQuery);
  if (dist2 <= 2) return 7;
  const fuzzy2 = queryWords.some((qw) =>
    textWords.some((tw) => levenshteinDistance(tw, qw) <= 2),
  );
  if (fuzzy2) return 7;

  return 99;
}

// Recherche et filtre les produits selon des critères multiples.
// Utilisé par la page Search.jsx pour le filtrage dynamique côté client.
// Paramètres :
//   products (array)  — tous les produits du catalogue (normalisés)
//   criteria (object) — filtres appliqués :
//     query          (string)  — recherche dans le nom du produit
//     description    (string)  — recherche dans la description
//     technical      (string)  — recherche dans les specs techniques et les tags
//     categoryId     (any)     — 'all' ou identifiant numérique de catégorie
//     availableOnly  (boolean) — si true, exclut les produits en rupture
//     minPrice       (string)  — prix minimum en euros (converti en centimes en interne)
//     maxPrice       (string)  — prix maximum en euros
//     sortBy         (string)  — critère de tri : 'relevance' | 'price' | 'createdAt' | 'availability'
//     sortDirection  (string)  — 'asc' ou 'desc'
// Retourne :
//   (array) — produits filtrés et triés, chacun enrichi d'un champ relevanceScore
export function searchProducts(products, criteria) {
  const {
    query = '',
    description = '',
    technical = '',
    categoryId = 'all',
    availableOnly = false,
    minPrice = '',
    maxPrice = '',
    sortBy = 'relevance',
    sortDirection = 'asc',
  } = criteria;

  // Conversion des prix en centimes pour comparer avec priceCents
  const minPriceCents = minPrice ? Number(minPrice) * 100 : 0;
  const maxPriceCents = maxPrice ? Number(maxPrice) * 100 : Number.MAX_SAFE_INTEGER;

  // Étape 1 : calcul du score de pertinence pour chaque produit
  const enrichedResults = products
    .map((product) => {
      // Score par champ : un score bas = meilleure pertinence
      const nameRank = getSearchRank(query, product.name);
      const descriptionRank = getSearchRank(description || query, product.description);
      const technicalRank = technical
        ? getSearchRank(technical, `${product.technicalFeatures.join(' ')} ${product.tags.join(' ')}`)
        : 0;

      return {
        ...product,
        // relevanceScore : meilleur score parmi les trois champs (le minimum = le plus pertinent)
        relevanceScore: Math.min(nameRank, descriptionRank, technicalRank || 99),
      };
    })
    // Étape 2 : application de tous les filtres
    .filter((product) => {
      const matchesCategory = categoryId === 'all' || product.categoryId === categoryId;
      const matchesAvailability = !availableOnly || product.availableStock > 0;
      const matchesMinPrice = product.priceCents >= minPriceCents;
      const matchesMaxPrice = product.priceCents <= maxPriceCents;
      // score 99 = aucun match texte → exclu si une recherche texte est active
      const matchesText = !query || product.relevanceScore < 99;
      const matchesDescription = !description || getSearchRank(description, product.description) < 99;
      const matchesTechnical =
        !technical || getSearchRank(technical, `${product.technicalFeatures.join(' ')} ${product.tags.join(' ')}`) < 99;

      return (
        matchesCategory &&
        matchesAvailability &&
        matchesMinPrice &&
        matchesMaxPrice &&
        matchesText &&
        matchesDescription &&
        matchesTechnical
      );
    });

  // Étape 3 : tri selon le critère choisi par l'utilisateur
  const sortedResults = [...enrichedResults].sort((left, right) => {
    if (sortBy === 'price') {
      return sortDirection === 'asc' ? left.priceCents - right.priceCents : right.priceCents - left.priceCents;
    }

    if (sortBy === 'createdAt') {
      return sortDirection === 'asc'
        ? new Date(left.createdAt) - new Date(right.createdAt)
        : new Date(right.createdAt) - new Date(left.createdAt);
    }

    if (sortBy === 'availability') {
      return sortDirection === 'asc'
        ? Number(right.availableStock > 0) - Number(left.availableStock > 0)
        : Number(left.availableStock > 0) - Number(right.availableStock > 0);
    }

    // Par défaut : tri par pertinence (score le plus bas = premier), puis alphabétique
    if (left.relevanceScore !== right.relevanceScore) {
      return left.relevanceScore - right.relevanceScore;
    }

    return left.name.localeCompare(right.name, 'fr');
  });

  return sortedResults;
}

// Enrichit les articles du panier avec les données produit et calcule les sous-totaux.
// Fait correspondre chaque élément du panier (cartItems) avec son produit complet.
// Paramètres :
//   cartItems (array) — articles du panier : [{ productId, quantity }]
//   products  (array) — catalogue complet de produits normalisés
// Retourne :
//   (array) — articles enrichis filtrés (les produits introuvables sont exclus) :
//     ...item            — champs originaux (productId, quantity)
//     product            — objet produit complet
//     availableQuantity  — quantité réelle disponible (plafonnée au stock)
//     isUnavailable      — true si le produit est en rupture de stock
//     lineTotalCents     — sous-total en centimes (0 si indisponible)
export function buildCartDetails(cartItems, products) {
  return cartItems
    .map((item) => {
      const product = products.find((candidate) => candidate.id === item.productId);
      // Produit supprimé du catalogue → on l'exclut silencieusement
      if (!product) {
        return null;
      }

      // On ne peut pas commander plus que le stock disponible
      const availableQuantity = Math.min(item.quantity, Math.max(product.availableStock, 0));
      // Le sous-total est 0 si le produit est indisponible (stock ≤ 0)
      const lineTotalCents = product.availableStock > 0 ? product.priceCents * availableQuantity : 0;

      return {
        ...item,
        product,
        availableQuantity,
        isUnavailable: product.availableStock <= 0,
        lineTotalCents,
      };
    })
    .filter(Boolean); // Retire les null (produits introuvables)
}

// Calcule les totaux du panier (sous-total, promotion, TVA, total TTC).
// Règle promotion : -5% si le sous-total dépasse 3 000 € (300 000 centimes).
// TVA fixe à 20% appliquée après déduction de la promotion.
// Paramètres :
//   cartDetails (array) — résultat de buildCartDetails() (articles enrichis avec lineTotalCents)
// Retourne :
//   {
//     subtotalCents    (number) — sous-total HT avant promotion
//     promotionCents   (number) — montant de la remise (0 si sous-total < 3 000 €)
//     taxCents         (number) — TVA 20% sur la base imposable
//     totalCents       (number) — total TTC à payer
//     unavailableCount (number) — nombre d'articles en rupture (bloque le checkout si > 0)
//   }
export function computeCartSummary(cartDetails) {
  const subtotalCents = cartDetails.reduce((sum, item) => sum + item.lineTotalCents, 0);
  // Promotion de 5% au-delà de 3 000 € d'achat
  const promotionCents = subtotalCents >= 300000 ? Math.round(subtotalCents * 0.05) : 0;
  const taxableBase = subtotalCents - promotionCents;  // Base imposable après remise
  const taxCents = Math.round(taxableBase * 0.2);       // TVA 20%
  const totalCents = taxableBase + taxCents;            // Total TTC
  const unavailableCount = cartDetails.filter((item) => item.isUnavailable).length;

  return {
    subtotalCents,
    promotionCents,
    taxCents,
    totalCents,
    unavailableCount,
  };
}

// Génère un identifiant de commande lisible basé sur l'horodatage.
// Utilisé uniquement en mode démo (le vrai id est généré par la base de données en prod).
// Retourne :
//   (string) — ex: "CMD-2026-837291"
export function createOrderId() {
  // Les 6 derniers chiffres du timestamp suffisent pour un usage démo non concurrent
  const timestamp = Date.now().toString().slice(-6);
  return `CMD-2026-${timestamp}`;
}
