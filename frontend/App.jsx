import React, { useEffect, useMemo, useState } from 'react';
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
import { useLocalStorage } from './hooks/useLocalStorage.js';
import {
  initialSession,
  initialUser,
} from './data/mockData.js';
import {
  buildCartDetails,
  buildRelatedProducts,
  computeCartSummary,
  formatPrice,
  searchProducts,
  sortProductsForCategory,
} from './utils/storefront.js';
import { storefrontService } from './services/storefrontService.js';
import { authService } from './services/authService.js';
import { accountService } from './services/accountService.js';
import { orderService } from './services/orderService.js';
import { getStoredAuthToken, persistAuthToken } from './services/apiClient.js';

import { adminService } from './services/adminService.js';
import { useI18n } from './contexts/I18nContext.jsx';

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

function RequireAuth({ isAuthenticated, children }) {
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}

function RequireAdmin({ isAuthenticated, isAdmin, children }) {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
    // Fonction manquante pour le checkout
    const handlePlaceOrder = async ({ billingAddress, paymentDetails }) => {
      if (cartSummary.unavailableCount > 0) {
        return { success: false, message: 'Retirez les produits indisponibles avant validation.' };
      }
      if (cartDetails.length === 0) {
        return { success: false, message: 'Votre panier est vide.' };
      }
      try {
        // Ici, on simule la validation et la création de commande (mock)
        const createdOrder = {
          id: `order-${Date.now()}`,
          billingAddress,
          paymentDetails,
          items: cartDetails.map((item) => ({ productId: item.productId, quantity: item.quantity })),
          status: 'confirmed',
          createdAt: new Date().toISOString(),
        };
        setOrders((previous) => [createdOrder, ...previous.filter((order) => order.id !== createdOrder.id)]);
        setLastOrderId(createdOrder.id);
        setCartItems([]);
        setProducts((previous) =>
          previous.map((product) => {
            const orderedItem = cartDetails.find((item) => item.productId === product.id);
            if (!orderedItem) return product;
            return { ...product, availableStock: Math.max(0, product.availableStock - orderedItem.quantity) };
          })
        );
        setUserProfile((previous) => ({
          ...previous,
          addresses: previous.addresses?.length ? previous.addresses : [billingAddress],
          paymentMethods: previous.paymentMethods?.length
            ? previous.paymentMethods
            : [
                {
                  id: `pm-${Date.now()}`,
                  label: 'Carte enregistrée',
                  cardholderName: paymentDetails.cardholderName,
                  last4: paymentDetails.cardNumber?.slice(-4) || '',
                  expiry: paymentDetails.expiry,
                },
              ],
        }));
        navigate('/confirmation', { order: createdOrder.id });
        return { success: true, message: 'Commande validée.' };
      } catch (error) {
        return { success: false, message: error.message || 'La commande n’a pas pu être enregistrée.' };
      }
    };
  const { t } = useI18n();
  const location = useLocation();
  const routerNavigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [homeContent, setHomeContent] = useState({ fixedMessage: '', carousel: [] });
  const [session, setSession] = useLocalStorage('althea-session', initialSession);
  // DEBUG : log l'état de session à chaque render
  // eslint-disable-next-line no-console
  console.log('[App] session:', session);
  const [userProfile, setUserProfile] = useLocalStorage('althea-user-profile', initialUser);
  const [cartItems, setCartItems] = useLocalStorage('althea-cart', []);
  const [orders, setOrders] = useState([]);
  const [lastOrderId, setLastOrderId] = useState(null);
  const [searchState, setSearchState] = useLocalStorage('althea-search-state', initialSearchState);
  const [authToken, setAuthToken] = useLocalStorage('althea-auth-token', getStoredAuthToken());
  const [adminStats, setAdminStats] = useState({ products: products.length, orders: orders.length, revenue: 0 });

  const isAdmin = session.role === 'admin';

  const loadStorefrontData = async () => {
    // Charge les produits depuis la BDD (API REST)
    try {
      const dbProducts = await storefrontService.getProducts();
      setProducts(dbProducts || []);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[Storefront] Erreur chargement produits BDD:', e);
    }
    // Charge les catégories et homeContent (si tu as une API dédiée, adapte ici)
    try {
      const storefrontData = await storefrontService.getInitialData();
      setCategories(storefrontData.categories || []);
      setHomeContent(storefrontData.homeContent || { fixedMessage: '', carousel: [] });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[Storefront] Erreur chargement home/catégories:', e);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Si admin connecté, charger les produits depuis le backend
    const fetchData = async () => {
      if (isAdmin && session.isAuthenticated && authToken) {
        try {
          const backendProducts = await adminService.listProducts();
          if (mounted) setProducts(backendProducts);
          // Charger aussi les commandes admin
          const backendOrders = await adminService.listOrders();
          if (mounted) setOrders(backendOrders);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error('[Admin] Erreur chargement produits/commandes backend:', e);
        }
      } else {
        // Sinon, charger les données publiques (storefront)
        await loadStorefrontData();
        // Charger les commandes utilisateur si connecté
        if (session.isAuthenticated && authToken) {
          try {
            const userOrders = await orderService.list();
            if (mounted) setOrders(userOrders);
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error('[User] Erreur chargement commandes:', e);
          }
        } else {
          setOrders([]);
        }
      }
    };
    fetchData();
    return () => {
      mounted = false;
    };
  }, [isAdmin, session.isAuthenticated, authToken]);

  // Met à jour lastOrderId quand les commandes changent
  useEffect(() => {
    if (!lastOrderId && orders.length > 0) {
      setLastOrderId(orders[0].id);
    }
  }, [orders, lastOrderId]);

  // Correction : on ne force plus la déconnexion si le token n'est pas encore à jour


  useEffect(() => {
    if (location.pathname === '/search') {
      const queryInHash = searchParams.get('q') || '';
      if (queryInHash && queryInHash !== searchState.query) {
        setSearchState((previous) => ({ ...previous, query: queryInHash }));
      }
    }
  }, [location.pathname, searchParams, searchState.query, setSearchState]);

  useEffect(() => {
    if (!session.isAuthenticated || !authToken) {
      return undefined;
    }

    let mounted = true;

    const syncAuthenticatedData = async () => {
      try {
        const profile = await accountService.getProfile();
        if (mounted) {
          setUserProfile((previous) => ({ ...previous, ...profile }));
        }

        const nextOrders = isAdmin ? await adminService.listOrders() : await orderService.list();
        if (mounted) {
          setOrders(nextOrders);
          if (!lastOrderId && nextOrders[0]?.id) {
            setLastOrderId(nextOrders[0].id);
          }
        }
      } catch (err) {
        // Ne déconnecte que si l'erreur est une 401/403 (auth invalide)
        const isAuthError = err && (err.status === 401 || err.status === 403 || (err.message && (err.message.includes('401') || err.message.includes('403') || err.message.toLowerCase().includes('unauthorized'))));
        if (mounted && isAuthError) {
          persistAuthToken('');
          setAuthToken('');
          setSession({ isAuthenticated: false, role: 'guest' });
        }
      }
    };

    syncAuthenticatedData();

    return () => {
      mounted = false;
    };
  }, [authToken, isAdmin, lastOrderId, session.isAuthenticated, setAuthToken, setLastOrderId, setOrders, setSession, setUserProfile]);

  useEffect(() => {
    let mounted = true;

    adminService.getStats({ products, orders }).then((stats) => {
      if (mounted) {
        setAdminStats(stats);
      }
    });

    return () => {
      mounted = false;
    };
  }, [products, orders]);

  const pathSegments = location.pathname.split('/').filter(Boolean);

  const sortedCategories = useMemo(
    () => [...categories].sort((left, right) => left.displayOrder - right.displayOrder),
    [categories],
  );

  const activeCategorySlug = pathSegments[0] === 'category' ? pathSegments[1] : sortedCategories[0]?.slug;
  const activeCategory = sortedCategories.find((category) => category.slug === activeCategorySlug) || sortedCategories[0];

  const categoryProducts = useMemo(() => {
    if (!activeCategory) {
      return [];
    }

    return sortProductsForCategory(products.filter((product) => product.categoryId === activeCategory.id));
  }, [activeCategory, products]);

  const selectedProductSlug = pathSegments[0] === 'product' ? pathSegments[1] : products[0]?.slug;
  const selectedProduct = products.find((product) => product.slug === selectedProductSlug) || products[0] || null;

  const relatedProducts = useMemo(() => {
    if (!selectedProduct) {
      return [];
    }

    return buildRelatedProducts(products, selectedProduct, 6);
  }, [products, selectedProduct]);

  const featuredProducts = useMemo(
    () => [...products].filter((product) => product.featuredRank > 0).sort((left, right) => left.featuredRank - right.featuredRank),
    [products],
  );

  const searchResults = useMemo(() => searchProducts(products, searchState), [products, searchState]);
  const cartDetails = useMemo(() => buildCartDetails(cartItems, products), [cartItems, products]);
  const cartSummary = useMemo(() => computeCartSummary(cartDetails), [cartDetails]);
  const currentOrder = orders.find((order) => order.id === (searchParams.get('order') || lastOrderId)) || orders[0] || null;


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

  const handleCategoryNavigation = (categorySlug) => navigate(`/category/${categorySlug}`);

  const handleProductNavigation = (productSlug) => navigate(`/product/${productSlug}`);

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

  const handleLogin = async (params) => {
    // Ne garder que email et password pour le backend
    const { email, password } = params;
    if (!email || !password) {
      return { success: false, message: 'Veuillez renseigner votre e-mail et votre mot de passe.' };
    }

    try {
      const result = await authService.login({ email, password });
      persistAuthToken(result.token);
      setAuthToken(result.token);
      // On force la persistance complète de la session dans le localStorage
      const newSession = { isAuthenticated: true, role: result.userRole, email: result.user?.email };
      setSession(newSession);
      window.localStorage.setItem('althea-session', JSON.stringify(newSession));
      setUserProfile((previous) => ({ ...previous, ...result.user }));
      // Redirige vers l'accueil après connexion
      navigate('/');
      return { success: true, message: 'Connexion réussie.' };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Connexion impossible.',
      };
    }
  };

  const handleRegister = async ({ firstName, lastName, email, password, company }) => {
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
      // Adapter les champs pour le backend
      const result = await authService.register({
        first_name: firstName,
        last_name: lastName,
        email,
        password
      });
      persistAuthToken(result.token);
      setAuthToken(result.token);
      setSession({ isAuthenticated: true, role: result.userRole });
      setUserProfile((previous) => ({ ...previous, ...result.user }));
      setOrders([]);
      return {
        success: true,
        message: 'Compte créé. Vérification e-mail à connecter ensuite si besoin.',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Inscription impossible.',
      };
    }
  };

  const handleSaveAccount = async (nextProfile) => {
    try {
      const [updatedUserFromProfile, updatedUserFromAddresses] = await Promise.all([
        accountService.updateProfile({
          firstName: nextProfile.firstName,
          lastName: nextProfile.lastName,
          phone: nextProfile.phone,
          company: nextProfile.company,
        }),
        accountService.updateAddresses(nextProfile.addresses || []),
      ]);
      setUserProfile((previous) => ({
        ...previous,
        ...updatedUserFromProfile,
        ...updatedUserFromAddresses,
      }));
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      const updatedOrder = await adminService.updateOrderStatus(orderId, status);
      setOrders((previous) =>
        previous.map((order) => (order.id === orderId ? { ...order, ...updatedOrder } : order)),
      );
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // noop
    }

    persistAuthToken('');
    setAuthToken('');

    setSession({ isAuthenticated: false, role: 'guest' });
    navigate('/');
  };

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

  const handleToggleProductPriority = async (productId) => {
    try {
      const product = products.find((p) => p.id === productId);
      if (!product) return;
      const maxPriority = Math.max(0, ...products.map((p) => p.priorityRank || 0));
      const nextPriority = product.priorityRank > 0 ? 0 : maxPriority + 1;
      const updated = await adminService.updateProduct(productId, { ...product, priorityRank: nextPriority });
      setProducts((prev) => prev.map((p) => p.id === productId ? updated : p));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[Admin] Erreur maj priorité produit:', e);
    }
  };

  const handleToggleProductAvailability = async (productId) => {
    try {
      const product = products.find((p) => p.id === productId);
      if (!product) return;
      const nextStock = product.availableStock > 0 ? 0 : 10;
      const updated = await adminService.updateProduct(productId, { ...product, availableStock: nextStock });
      setProducts((prev) => prev.map((p) => p.id === productId ? updated : p));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[Admin] Erreur maj stock produit:', e);
    }
  };

  const handleToggleFeatured = async (productId) => {
    try {
      const product = products.find((p) => p.id === productId);
      if (!product) return;
      const maxFeatured = Math.max(0, ...products.map((p) => p.featuredRank || 0));
      const nextFeatured = product.featuredRank > 0 ? 0 : maxFeatured + 1;
      const updated = await adminService.updateProduct(productId, { ...product, featuredRank: nextFeatured });
      setProducts((prev) => prev.map((p) => p.id === productId ? updated : p));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[Admin] Erreur maj featured produit:', e);
    }
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

  const cartCount = Array.isArray(cartItems) ? cartItems.reduce((sum, item) => sum + item.quantity, 0) : 0;

  const navItems = useMemo(
    () => [
      { label: t('nav.home'), path: '/' },
      { label: t('nav.catalog'), path: '/catalog' },
      { label: t('nav.orders'), path: '/orders' },
    ],
    [t],
  );



  const formattedAdminStats = {
    ...adminStats,
    revenueFormatted: formatPrice(adminStats.revenue || 0),
  };

  return (
    <div className="app-shell">
      <Header
        navItems={navItems}
        currentPath={location.pathname}
        cartCount={cartCount}
        searchValue={searchState.query}
        isAuthenticated={session.isAuthenticated}
        isAdmin={isAdmin}
        userProfile={userProfile}
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
          <Route
            path="/category/:slug"
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
          <Route
            path="/product/:slug"
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
          <Route path="/confirmation" element={<Confirmation order={currentOrder} products={products} onNavigate={navigate} />} />
          <Route path="/register" element={<Register onRegister={handleRegister} onNavigate={navigate} />} />
          <Route path="/login" element={<Login onLogin={handleLogin} onNavigate={navigate} />} />
          <Route path="/forgot" element={<ForgotPassword />} />

          <Route
            path="/account"
            element={
              <RequireAuth isAuthenticated={session.isAuthenticated}>
                <Account user={userProfile} session={session} orders={orders} onSave={handleSaveAccount} onNavigate={navigate} />
              </RequireAuth>
            }
          />
          <Route
            path="/account/settings"
            element={
              <RequireAuth isAuthenticated={session.isAuthenticated}>
                <AccountSettings onNavigate={navigate} />
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
            <Route path="dashboard" element={<AdminDashboard stats={formattedAdminStats} />} />
            <Route path="products" element={<AdminProducts products={products} categories={sortedCategories} onToggleProductPriority={handleToggleProductPriority} onToggleFeatured={handleToggleFeatured} onToggleProductAvailability={handleToggleProductAvailability} />} />
            <Route path="categories" element={<AdminCategories categories={sortedCategories} onSetCategoryOrder={handleSetCategoryOrder} />} />
            <Route path="orders" element={<AdminOrders orders={orders} products={products} onUpdateOrderStatus={handleUpdateOrderStatus} />} />
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
                />
              }
            />
            <Route path="support" element={<AdminSupport />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <Footer onNavigate={navigate} />
    </div>
  );
}
