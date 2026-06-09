import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import Breadcrumbs from './components/Breadcrumbs.jsx';
import './styles/App.css';

import Home from './pages/Home/Home.jsx';
import Category from './pages/Category/Category.jsx';
import Product from './pages/Product/Product.jsx';
import Search from './pages/Search/Search.jsx';
import Cart from './pages/Cart/Cart.jsx';
import Checkout from './pages/Checkout/Checkout.jsx';
import Confirmation from './pages/Confirmation/Confirmation.jsx';
import Register from './pages/Register/Register.jsx';
import Login from './pages/Login/Login.jsx';
import Account from './pages/Account/Account.jsx';
import OrderHistory from './pages/OrderHistory/OrderHistory.jsx';
import Contact from './pages/Contact/Contact.jsx';
import Admin from './pages/Admin/Admin.jsx';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword.jsx';
import AccountSettings from './pages/AccountSettings/AccountSettings.jsx';
import AccountAddresses from './pages/AccountAddresses/AccountAddresses.jsx';
import AccountPayments from './pages/AccountPayments/AccountPayments.jsx';
import TermsPage from './pages/Static/TermsPage.jsx';
import LegalPage from './pages/Static/LegalPage.jsx';
import AboutPage from './pages/Static/AboutPage.jsx';
import NotFound from './pages/NotFound/NotFound.jsx';
import AdminLayout from './pages/Admin/AdminLayout.jsx';
import AdminDashboard from './pages/Admin/AdminDashboard.jsx';
import AdminProducts from './pages/Admin/AdminProducts.jsx';
import AdminCategories from './pages/Admin/AdminCategories.jsx';
import AdminOrders from './pages/Admin/AdminOrders.jsx';
import AdminSupport from './pages/Admin/AdminSupport.jsx';
import AdminUsers from './pages/Admin/AdminUsers.jsx';
import ResetPassword from './pages/ResetPassword/ResetPassword.jsx';
import TwoFAVerify from './pages/TwoFAVerify/TwoFAVerify.jsx';
import VerifyEmail from './pages/VerifyEmail/VerifyEmail.jsx';
import ResendVerification from './pages/ResendVerification/ResendVerification.jsx';
import { useLocalStorage } from './hooks/useLocalStorage.js';
import {
  initialCart,
  initialCategories,
  initialHomeContent,
  initialOrders,
  initialProducts,
  initialSession,
  initialUser,
} from './data/mockData.js';
import {
  buildCartDetails,
  buildRelatedProducts,
  computeCartSummary,
  createOrderId,
  formatPrice,
  searchProducts,
  sortProductsForCategory,
} from './utils/storefront.js';
import { authService } from './services/authService.js';
import { storefrontService } from './services/storefrontService.js';
import { checkoutService } from './services/checkoutService.js';
import { apiClient, persistAuthToken } from './services/apiClient.js';
import { useI18n } from './contexts/I18nContext.jsx';
import Chatbot from './components/Chatbot/Chatbot.jsx';

const initialSearchState = {
  query: '',
  description: '',
  technical: '',
  categoryId: 'all',
  availableOnly: false,
  minPrice: '',
  maxPrice: '',
  sortBy: 'relevance',
  sortDirection: 'asc',
};

function getPasswordValidation(password) {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

// Convertit une commande backend (snake_case, total en €) en format frontend
function normalizeOrder(o) {
  return {
    id: String(o.id),
    createdAt: o.created_at ? String(o.created_at).slice(0, 10) : '',
    status: o.status || 'En préparation',
    totalCents: Math.round(Number(o.total_amount) * 100),
    items: (o.items || []).map((item) => ({
      productId: item.product_id,
      quantity: Number(item.quantity),
    })),
    billingAddress: typeof o.billing_address === 'string'
      ? JSON.parse(o.billing_address)
      : (o.billing_address || {}),
    paymentSummary: o.payment_summary || '',
  };
}

function RequireAuth({ isAuthenticated, children }) {
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}

function RequireAdmin({ isAuthenticated, isAdmin, children }) {
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// Purger les données mock au premier chargement (IDs mock = chaînes commençant par 'prod-')
// Cette migration s'exécute une seule fois avant le premier rendu de l'app.
(function purgeMockData() {
  try {
    const cartRaw = localStorage.getItem('althea-cart');
    if (cartRaw) {
      const cart = JSON.parse(cartRaw);
      const cleaned = cart.filter((i) => typeof i.productId !== 'string' || !i.productId.startsWith('prod-'));
      if (cleaned.length !== cart.length) localStorage.setItem('althea-cart', JSON.stringify(cleaned));
    }
    const ordersRaw = localStorage.getItem('althea-orders');
    if (ordersRaw) {
      const orders = JSON.parse(ordersRaw);
      const cleaned = orders.filter((o) => typeof o.id !== 'string' || !o.id.startsWith('CMD-2026-100'));
      if (cleaned.length !== orders.length) localStorage.setItem('althea-orders', JSON.stringify(cleaned));
    }
    const profileRaw = localStorage.getItem('althea-user-profile');
    if (profileRaw) {
      const profile = JSON.parse(profileRaw);
      if (profile.email === 'lina.martin@cabinet-demo.fr') {
        localStorage.removeItem('althea-user-profile');
      }
    }
  } catch {}
}());

export default function App() {
  const { t } = useI18n();
  const location = useLocation();
  const routerNavigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [categories, setCategories] = useLocalStorage('althea-categories', initialCategories);
  const [products, setProducts] = useLocalStorage('althea-products', initialProducts);
  const [homeContent, setHomeContent] = useLocalStorage('althea-home-content', initialHomeContent);
  const [session, setSession] = useLocalStorage('althea-session', initialSession);
  const [userProfile, setUserProfile] = useLocalStorage('althea-user-profile', initialUser);
  const [cartItems, setCartItems] = useLocalStorage('althea-cart', initialCart);
  const [orders, setOrders] = useLocalStorage('althea-orders', initialOrders);
  const [lastOrderId, setLastOrderId] = useLocalStorage('althea-last-order-id', null);
  const [pendingAdmin2FA, setPendingAdmin2FA] = useState(null); // { userId, rememberMe }
  const [searchState, setSearchState] = useLocalStorage('althea-search-state', initialSearchState);

  useEffect(() => {
    if (location.pathname === '/search') {
      const queryInHash = searchParams.get('q') || '';
      if (queryInHash && queryInHash !== searchState.query) {
        setSearchState((previous) => ({ ...previous, query: queryInHash }));
      }
    }
  }, [location.pathname, searchParams, searchState.query, setSearchState]);

  // Chargement initial : catalogue depuis le backend + nettoyage du panier
  useEffect(() => {
    let mounted = true;
    storefrontService.getInitialData().then((data) => {
      if (!mounted) return;
      if (data.products.length > 0) {
        setProducts(data.products);
        // Supprimer du panier les articles dont le productId n'existe pas dans le catalogue réel
        const realIds = new Set(data.products.map((p) => p.id));
        setCartItems((prev) => prev.filter((item) => realIds.has(item.productId)));
      }
      if (data.categories.length > 0) setCategories(data.categories);
      if (data.homeContent) setHomeContent(data.homeContent);
    }).catch(() => {});
    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Restaurer les commandes depuis le backend si l'utilisateur est déjà connecté (refresh page)
  useEffect(() => {
    if (!session.isAuthenticated) return;
    apiClient.get('/pg/orders')
      .then((data) => setOrders((data.orders || []).map(normalizeOrder)))
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const pathSegments = location.pathname.split('/').filter(Boolean);

  const sortedCategories = useMemo(
    () => [...categories].sort((left, right) => left.displayOrder - right.displayOrder),
    [categories],
  );

  const activeCategorySlug = (pathSegments[0] === 'category' || pathSegments[0] === 'categories') ? pathSegments[1] : sortedCategories[0]?.slug;
  const activeCategory = sortedCategories.find((category) => category.slug === activeCategorySlug) || sortedCategories[0];

  const categoryProducts = useMemo(() => {
    if (!activeCategory) {
      return [];
    }

    return sortProductsForCategory(products.filter((product) => product.categoryId === activeCategory.id));
  }, [activeCategory, products]);

  const selectedProductSlug = (pathSegments[0] === 'product' || pathSegments[0] === 'products') ? pathSegments[1] : products[0]?.slug;
  const selectedProduct = products.find((product) => product.slug === selectedProductSlug) || products[0] || null;

  const relatedProducts = useMemo(() => {
    if (!selectedProduct) {
      return [];
    }

    return buildRelatedProducts(products, selectedProduct, 6);
  }, [products, selectedProduct]);

  const featuredProducts = useMemo(
    () =>
      [...products]
        .filter((product) => product.featuredRank > 0)
        .sort((left, right) => left.featuredRank - right.featuredRank),
    [products],
  );

  const searchResults = useMemo(() => searchProducts(products, searchState), [products, searchState]);
  const cartDetails = useMemo(() => buildCartDetails(cartItems, products), [cartItems, products]);
  const cartSummary = useMemo(() => computeCartSummary(cartDetails), [cartDetails]);
  const currentOrder = orders.find((order) => order.id === (searchParams.get('order') || lastOrderId)) || orders[0] || null;

  const isAdmin = session.role === 'admin';

  const navigate = (path, params = {}) => {
    const nextParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        nextParams.set(key, value);
      }
    });

    routerNavigate({
      pathname: path,
      search: nextParams.toString() ? `?${nextParams.toString()}` : '',
    });
  };

  const handleCategoryNavigation = (categorySlug) => navigate(`/categories/${categorySlug}`);

  const handleProductNavigation = (productSlug) => navigate(`/products/${productSlug}`);

  const handleHeaderSearch = (query) => {
    setSearchState((previous) => ({ ...previous, query }));
    navigate('/search', { q: query });
  };

  const handleAddToCart = (productId, quantity = 1) => {
    setCartItems((previous) => {
      const existingItem = previous.find((item) => item.productId === productId);

      if (existingItem) {
        return previous.map((item) =>
          item.productId === productId ? { ...item, quantity: item.quantity + quantity } : item,
        );
      }

      return [...previous, { productId, quantity }];
    });
  };

  const handleUpdateCartQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      setCartItems((previous) => previous.filter((item) => item.productId !== productId));
      return;
    }

    setCartItems((previous) =>
      previous.map((item) => (item.productId === productId ? { ...item, quantity } : item)),
    );
  };

  const handleRemoveCartItem = (productId) => {
    setCartItems((previous) => previous.filter((item) => item.productId !== productId));
  };

  const handleLogin = useCallback(async ({ email, password, rememberMe = true }) => {
    if (!email || !password) {
      return { success: false, message: 'Veuillez renseigner votre e-mail et votre mot de passe.' };
    }
    try {
      const result = await authService.login({ email, password, rememberMe });
      // Admin → 2FA requis, on redirige vers la page OTP
      if (result.requires_2fa) {
        setPendingAdmin2FA({ userId: result.user_id, rememberMe });
        navigate('/verify-2fa');
        return { success: true, message: 'Code de vérification envoyé à votre adresse e-mail.' };
      }
      const role = result.userRole || (result.user?.is_admin ? 'admin' : 'customer');
      setSession({ isAuthenticated: true, role });
      setUserProfile({
        firstName: result.user?.first_name || '',
        lastName: result.user?.last_name || '',
        email: result.user?.email || email,
        phone: '',
        company: '',
        verified: true,
        role,
        id: result.user?.id,
        addresses: [],
        paymentMethods: [],
      });
      // Charger les commandes réelles de l'utilisateur
      apiClient.get('/pg/orders')
        .then((data) => setOrders((data.orders || []).map(normalizeOrder)))
        .catch(() => setOrders([]));
      return { success: true, message: 'Connexion réussie.' };
    } catch (err) {
      return { success: false, message: err.message || 'Identifiants invalides.' };
    }
  }, [setSession, setUserProfile, setOrders]);

  const handleRegister = useCallback(async ({ firstName, lastName, email, password, company }) => {
    if (!firstName || !lastName || !email) {
      return { success: false, message: 'Tous les champs obligatoires doivent être complétés.' };
    }
    if (!getPasswordValidation(password)) {
      return {
        success: false,
        message: 'Le mot de passe doit contenir 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.',
      };
    }
    try {
      const result = await authService.register({ firstName, lastName, email, password });
      // Si le backend demande une confirmation par email, on ne connecte pas l'utilisateur
      if (result.requires_confirmation) {
        return {
          success: true,
          requiresConfirmation: true,
          message: `Un e-mail de confirmation a été envoyé à ${email}. Cliquez sur le lien pour activer votre compte.`,
        };
      }
      // Fallback si le backend retourne directement un token (ancienne version)
      const role = 'customer';
      setUserProfile({
        firstName,
        lastName,
        email: result.user?.email || email,
        phone: '',
        company: company || '',
        verified: true,
        role,
        id: result.user?.id,
        addresses: [],
        paymentMethods: [],
      });
      setOrders([]);
      setSession({ isAuthenticated: true, role });
      return { success: true, message: 'Compte créé avec succès. Bienvenue !' };
    } catch (err) {
      return { success: false, message: err.message || 'Erreur lors de la création du compte.' };
    }
  }, [setSession, setUserProfile, setOrders]);

  const handleVerifyEmail = useCallback((data) => {
    const role = data.user?.is_admin ? 'admin' : 'customer';
    setSession({ isAuthenticated: true, role });
    setUserProfile({
      firstName: data.user?.first_name || '',
      lastName: data.user?.last_name || '',
      email: data.user?.email || '',
      phone: '',
      company: '',
      verified: true,
      role,
      id: data.user?.id,
      addresses: [],
      paymentMethods: [],
    });
    setOrders([]);
  }, [setSession, setUserProfile, setOrders]);

  const handle2FAVerify = useCallback(async ({ user_id, otp, rememberMe }) => {
    const result = await authService.verify2fa({ user_id, otp, rememberMe });
    const role = 'admin';
    setSession({ isAuthenticated: true, role });
    setUserProfile({
      firstName: result.user?.first_name || '',
      lastName: result.user?.last_name || '',
      email: result.user?.email || '',
      phone: '', company: '', verified: true, role,
      id: result.user?.id,
      addresses: [], paymentMethods: [],
    });
    apiClient.get('/pg/orders')
      .then((data) => setOrders((data.orders || []).map(normalizeOrder)))
      .catch(() => setOrders([]));
    setPendingAdmin2FA(null);
    navigate('/admin/dashboard');
  }, [setSession, setUserProfile, setOrders, navigate]);

  const handleSaveAccount = (nextProfile) => {
    setUserProfile((previous) => ({
      ...previous,
      ...nextProfile,
    }));
  };

  const handlePlaceOrder = useCallback(async ({ billingAddress, paymentDetails }) => {
    if (cartSummary.unavailableCount > 0) {
      return { success: false, message: 'Retirez les produits indisponibles avant validation.' };
    }
    if (cartDetails.length === 0) {
      return { success: false, message: 'Votre panier est vide.' };
    }

    // Si connecté, on passe par le backend (crée la commande + décrémente le stock)
    if (session.isAuthenticated) {
      try {
        const order = await checkoutService.placeOrder({
          items: cartDetails,
          billingAddress,
          paymentDetails,
        });
        const nextOrder = {
          id: order.id,
          createdAt: order.created_at?.slice(0, 10) || new Date().toISOString().slice(0, 10),
          status: order.status || 'En préparation',
          totalCents: Math.round(Number(order.total_amount) * 100),
          items: cartDetails.map((item) => ({ productId: item.productId, quantity: item.quantity })),
          billingAddress,
          paymentSummary: order.payment_summary || '',
        };
        setOrders((previous) => [nextOrder, ...previous]);
        setLastOrderId(nextOrder.id);
        setCartItems([]);
        navigate('/confirmation', { order: nextOrder.id });
        return { success: true, message: 'Commande validée.' };
      } catch (err) {
        return { success: false, message: err.message || 'Erreur lors de la création de la commande.' };
      }
    }

    // Invité : commande locale uniquement
    const nextOrder = {
      id: createOrderId(),
      createdAt: new Date().toISOString().slice(0, 10),
      status: 'En attente de confirmation',
      totalCents: cartSummary.totalCents,
      items: cartDetails.map((item) => ({ productId: item.productId, quantity: item.quantity })),
      billingAddress,
      paymentSummary: `${paymentDetails.cardholderName} •••• ${paymentDetails.cardNumber.slice(-4)}`,
    };
    setOrders((previous) => [nextOrder, ...previous]);
    setLastOrderId(nextOrder.id);
    setCartItems([]);
    navigate('/confirmation', { order: nextOrder.id });
    return { success: true, message: 'Commande enregistrée (mode invité).' };
  }, [cartSummary, cartDetails, session.isAuthenticated, setOrders, setLastOrderId, setCartItems, navigate]);

  const handleUpdateOrderStatus = (orderId, status) => {
    setOrders((previous) =>
      previous.map((order) => (order.id === orderId ? { ...order, status } : order)),
    );
  };

  const handleLogout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      persistAuthToken(null);
    }
    setSession({ isAuthenticated: false, role: 'guest' });
    setUserProfile(initialUser);
    setOrders([]);
    setCartItems([]);
    navigate('/');
  }, [setSession, setUserProfile, setOrders, setCartItems, navigate]);

  const handleMoveCarouselSlide = (slideId, direction) => {
    setHomeContent((previous) => {
      const slides = [...previous.carousel];
      const index = slides.findIndex((slide) => slide.id === slideId);
      const targetIndex = direction === 'up' ? index - 1 : index + 1;

      if (index < 0 || targetIndex < 0 || targetIndex >= slides.length) {
        return previous;
      }

      [slides[index], slides[targetIndex]] = [slides[targetIndex], slides[index]];
      return { ...previous, carousel: slides };
    });
  };

  const handleToggleProductPriority = (productId) => {
    setProducts((previous) => {
      const maxPriority = Math.max(0, ...previous.map((product) => product.priorityRank || 0));

      return previous.map((product) =>
        product.id === productId
          ? { ...product, priorityRank: product.priorityRank > 0 ? 0 : maxPriority + 1 }
          : product,
      );
    });
  };

  const handleToggleProductAvailability = (productId) => {
    setProducts((previous) =>
      previous.map((product) =>
        product.id === productId
          ? { ...product, availableStock: product.availableStock > 0 ? 0 : 10 }
          : product,
      ),
    );
  };

  const handleToggleFeatured = (productId) => {
    setProducts((previous) => {
      const maxFeatured = Math.max(0, ...previous.map((product) => product.featuredRank || 0));

      return previous.map((product) =>
        product.id === productId
          ? { ...product, featuredRank: product.featuredRank > 0 ? 0 : maxFeatured + 1 }
          : product,
      );
    });
  };

  const handleDeleteProduct = (productId) => {
    if (!window.confirm('Supprimer ce produit de l’interface admin ?')) {
      return;
    }

    setProducts((previous) =>
      previous.filter((product) => product.id !== productId),
    );
  };

  const handleSetCategoryOrder = (categoryId, displayOrder) => {
    setCategories((previous) =>
      previous.map((category) =>
        category.id === categoryId ? { ...category, displayOrder: Number(displayOrder) } : category,
      ),
    );
  };

  const handleUpdateHomeMessage = (fixedMessage) => {
    setHomeContent((previous) => ({ ...previous, fixedMessage }));
  };

  const handleUpdateCarousel = (carousel) => {
    setHomeContent((previous) => ({ ...previous, carousel }));
  };

  const handleUpdateCategory = (categoryId, changes) => {
    setCategories((previous) =>
      previous.map((cat) => (cat.id === categoryId ? { ...cat, ...changes } : cat)),
    );
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const navItems = useMemo(
    () => [
      { label: t('nav.home'), path: '/' },
      { label: t('nav.catalog'), path: '/catalog' },
      { label: t('nav.orders'), path: '/orders' },
    ],
    [t],
  );

  const userMenuItems = useMemo(
    () =>
      session.isAuthenticated
        ? [
            { label: 'Mon compte', path: '/account' },
            { label: 'Mes commandes', path: '/orders' },
            { label: 'Déconnexion', path: '/logout' },
          ]
        : [],
    [session.isAuthenticated],
  );

  return (
    <div className="app-shell">
      <Header
        navItems={navItems}
        currentPath={location.pathname}
        cartCount={cartCount}
        searchValue={searchState.query}
        isAuthenticated={session.isAuthenticated}
        isAdmin={isAdmin}
        userMenuItems={userMenuItems}
        onNavigate={navigate}
        onSearchSubmit={handleHeaderSearch}
        onLogout={handleLogout}
        showRegisterAction={!session.isAuthenticated}
      />

      <main className="app-main">
        <Breadcrumbs />

        <Routes>
          <Route
            path="/"
            element={
              <Home
                homeContent={homeContent}
                categories={sortedCategories}
                featuredProducts={featuredProducts}
                onOpenCategory={handleCategoryNavigation}
                onOpenProduct={handleProductNavigation}
                onNavigate={navigate}
              />
            }
          />

          <Route
            path="/catalog"
            element={
              <Category
                categories={sortedCategories}
                activeCategory={activeCategory}
                products={categoryProducts}
                onSelectCategory={handleCategoryNavigation}
                onOpenProduct={handleProductNavigation}
              />
            }
          />

          {/* Route principale catégorie (pluriel) + alias singulier pour compatibilité */}
          <Route
            path="/categories/:slug"
            element={
              <Category
                categories={sortedCategories}
                activeCategory={activeCategory}
                products={categoryProducts}
                onSelectCategory={handleCategoryNavigation}
                onOpenProduct={handleProductNavigation}
              />
            }
          />
          <Route path="/category/:slug" element={<Navigate to={`/categories/${pathSegments[1] || ''}`} replace />} />

          {/* Route principale produit (pluriel) + alias singulier pour compatibilité */}
          <Route
            path="/products/:slug"
            element={
              <Product
                product={selectedProduct}
                relatedProducts={relatedProducts}
                onAddToCart={handleAddToCart}
                onBuyNow={(productId) => {
                  handleAddToCart(productId, 1);
                  navigate('/checkout');
                }}
                onOpenProduct={handleProductNavigation}
              />
            }
          />
          <Route path="/product/:slug" element={<Navigate to={`/products/${pathSegments[1] || ''}`} replace />} />

          <Route
            path="/search"
            element={
              <Search
                categories={sortedCategories}
                criteria={searchState}
                onChangeCriteria={setSearchState}
                results={searchResults}
                onOpenProduct={handleProductNavigation}
              />
            }
          />

          <Route
            path="/cart"
            element={
              <Cart
                items={cartDetails}
                summary={cartSummary}
                isAuthenticated={session.isAuthenticated}
                onUpdateQuantity={handleUpdateCartQuantity}
                onRemoveItem={handleRemoveCartItem}
                onNavigate={navigate}
              />
            }
          />

          <Route
            path="/checkout"
            element={
              <Checkout
                cartItems={cartDetails}
                summary={cartSummary}
                user={userProfile}
                session={session}
                onNavigate={navigate}
                onLogin={handleLogin}
                onRegister={handleRegister}
                onPlaceOrder={handlePlaceOrder}
              />
            }
          />

          <Route
            path="/confirmation"
            element={<Confirmation order={currentOrder} products={products} onNavigate={navigate} />}
          />

          <Route path="/register" element={<Register onRegister={handleRegister} onNavigate={navigate} />} />
          <Route path="/login" element={<Login onLogin={handleLogin} onNavigate={navigate} />} />
          <Route path="/forgot" element={<ForgotPassword onNavigate={navigate} />} />
          <Route path="/forgot-password" element={<ForgotPassword onNavigate={navigate} />} />
          <Route path="/reset-password" element={<ResetPassword onNavigate={navigate} />} />
          <Route
            path="/verify-email"
            element={<VerifyEmail onVerified={handleVerifyEmail} onNavigate={navigate} />}
          />
          <Route path="/resend-verification" element={<ResendVerification onNavigate={navigate} />} />
          <Route
            path="/verify-2fa"
            element={
              <TwoFAVerify
                userId={pendingAdmin2FA?.userId}
                rememberMe={pendingAdmin2FA?.rememberMe}
                onVerified={handle2FAVerify}
                onNavigate={navigate}
              />
            }
          />

          <Route
            path="/account"
            element={
              <RequireAuth isAuthenticated={session.isAuthenticated}>
                <Account
                  user={userProfile}
                  session={session}
                  orders={orders}
                  onSave={handleSaveAccount}
                  onNavigate={navigate}
                />
              </RequireAuth>
            }
          />

          <Route
            path="/account/settings"
            element={
              <RequireAuth isAuthenticated={session.isAuthenticated}>
                <AccountSettings user={userProfile} onSave={handleSaveAccount} onNavigate={navigate} />
              </RequireAuth>
            }
          />

          <Route
            path="/account/addresses"
            element={
              <RequireAuth isAuthenticated={session.isAuthenticated}>
                <AccountAddresses user={userProfile} onNavigate={navigate} />
              </RequireAuth>
            }
          />

          <Route
            path="/account/payments"
            element={
              <RequireAuth isAuthenticated={session.isAuthenticated}>
                <AccountPayments user={userProfile} onNavigate={navigate} />
              </RequireAuth>
            }
          />

          <Route
            path="/orders"
            element={
              <RequireAuth isAuthenticated={session.isAuthenticated}>
                <OrderHistory orders={orders} products={products} onNavigate={navigate} />
              </RequireAuth>
            }
          />

          {/* Alias spec : /account/orders → /orders */}
          <Route path="/account/orders" element={<Navigate to="/orders" replace />} />

          <Route path="/contact" element={<Contact onNavigate={navigate} />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/legal" element={<LegalPage />} />
          <Route path="/about" element={<AboutPage />} />

          <Route
            path="/admin"
            element={
              <RequireAdmin isAuthenticated={session.isAuthenticated} isAdmin={isAdmin}>
                <AdminLayout />
              </RequireAdmin>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />

            <Route path="dashboard" element={<AdminDashboard />} />

            <Route path="products" element={<AdminProducts />} />

            <Route
              path="categories"
              element={
                <AdminCategories
                  categories={sortedCategories}
                  onSetCategoryOrder={handleSetCategoryOrder}
                />
              }
            />

            <Route path="orders" element={<AdminOrders />} />

            <Route
              path="content/home"
              element={
                <Admin
                  homeContent={homeContent}
                  categories={sortedCategories}
                  products={products}
                  orders={orders}
                  onUpdateHomeMessage={handleUpdateHomeMessage}
                  onMoveCarouselSlide={handleMoveCarouselSlide}
                  onToggleProductPriority={handleToggleProductPriority}
                  onToggleProductAvailability={handleToggleProductAvailability}
                  onToggleFeatured={handleToggleFeatured}
                  onSetCategoryOrder={handleSetCategoryOrder}
                  onOpenProduct={handleProductNavigation}
                  onUpdateCarousel={handleUpdateCarousel}
                  onUpdateCategory={handleUpdateCategory}
                />
              }
            />

            <Route path="users" element={<AdminUsers />} />
            <Route path="support" element={<AdminSupport />} />
            {/* Alias spec : /admin/homepage → /admin/content/home */}
            <Route path="homepage" element={<Navigate to="/admin/content/home" replace />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <Footer onNavigate={navigate} />
      <Chatbot />
    </div>
  );
}