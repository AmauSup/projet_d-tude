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
  formatPrice,
  searchProducts,
  sortProductsForCategory,
} from './utils/storefront.js';
import { storefrontService } from './services/storefrontService.js';
import { authService } from './services/authService.js';
import { accountService } from './services/accountService.js';
import { orderService } from './services/orderService.js';
import { checkoutService } from './services/checkoutService.js';
import { adminService } from './services/adminService.js';
import { getStoredAuthToken, persistAuthToken } from './services/apiClient.js';
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
  const [lastOrderId, setLastOrderId] = useLocalStorage('althea-last-order-id', initialOrders[0]?.id ?? null);
  const [searchState, setSearchState] = useLocalStorage('althea-search-state', initialSearchState);
  const [authToken, setAuthToken] = useLocalStorage('althea-auth-token', getStoredAuthToken());
  const [adminStats, setAdminStats] = useState({ products: products.length, orders: orders.length, revenue: 0 });

  const isAdmin = session.role === 'admin';

  const loadStorefrontData = async () => {
    const storefrontData = await storefrontService.getInitialData();
    setCategories(storefrontData.categories);
    setProducts(storefrontData.products);
    setHomeContent(storefrontData.homeContent);
  };

  useEffect(() => {
    let mounted = true;

    loadStorefrontData().catch(() => {
      if (!mounted) {
        return;
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (session.isAuthenticated && !authToken) {
      setSession({ isAuthenticated: false, role: 'guest' });
    }
  }, [authToken, session.isAuthenticated, setSession]);

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
      } catch {
        if (mounted) {
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

  const handleLogin = async ({ email, password }) => {
    if (!email || !password) {
      return { success: false, message: 'Veuillez renseigner votre e-mail et votre mot de passe.' };
    }

    try {
      const result = await authService.login({ email, password });
      persistAuthToken(result.token);
      setAuthToken(result.token);
      setSession({ isAuthenticated: true, role: result.userRole });
      setUserProfile((previous) => ({ ...previous, ...result.user }));

      return { success: true, message: 'Connexion reussie.' };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Connexion impossible.',
      };
    }
  };

  const handleRegister = async ({ firstName, lastName, email, password, company }) => {
    if (!firstName || !lastName || !email) {
      return { success: false, message: 'Tous les champs obligatoires doivent etre completes.' };
    }

    if (!getPasswordValidation(password)) {
      return {
        success: false,
        message: 'Le mot de passe doit contenir 8 caracteres, une majuscule, une minuscule, un chiffre et un caractere special.',
      };
    }

    try {
      const result = await authService.register({
        firstName,
        lastName,
        email,
        password,
        company,
      });
      persistAuthToken(result.token);
      setAuthToken(result.token);
      setSession({ isAuthenticated: true, role: result.userRole });
      setUserProfile((previous) => ({ ...previous, ...result.user }));
      setOrders([]);

      return {
        success: true,
        message: 'Compte cree. Verification e-mail a connecter ensuite si besoin.',
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

  const handlePlaceOrder = async ({ billingAddress, paymentDetails }) => {
    if (cartDetails.length === 0) {
      return { success: false, message: 'Votre panier est vide.' };
    }

    try {
      const validation = await checkoutService.validateBeforePayment({
        hasUnavailableItems: cartSummary.unavailableCount > 0,
        hasItems: cartDetails.length > 0,
      });

      if (!validation.valid) {
        return { success: false, message: validation.message };
      }

      await checkoutService.createPaymentIntent();

      const createdOrder = await orderService.create({
        billingAddress,
        paymentDetails,
        items: cartDetails.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      });

      setOrders((previous) => [createdOrder, ...previous.filter((order) => order.id !== createdOrder.id)]);
      setLastOrderId(createdOrder.id);
      setCartItems([]);
      setProducts((previous) =>
        previous.map((product) => {
          const orderedItem = cartDetails.find((item) => item.productId === product.id);
          if (!orderedItem) {
            return product;
          }

          return {
            ...product,
            availableStock: Math.max(0, product.availableStock - orderedItem.quantity),
          };
        }),
      );
      setUserProfile((previous) => ({
        ...previous,
        addresses: previous.addresses?.length ? previous.addresses : [billingAddress],
        paymentMethods: previous.paymentMethods?.length
          ? previous.paymentMethods
          : [
              {
                id: `pm-${Date.now()}`,
                label: 'Carte enregistree',
                cardholderName: paymentDetails.cardholderName,
                last4: paymentDetails.cardNumber.slice(-4),
                expiry: paymentDetails.expiry,
              },
            ],
      }));

      navigate('/confirmation', { order: createdOrder.id });
      return { success: true, message: 'Commande validee.' };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'La commande n a pas pu etre enregistree.',
      };
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

  const handleMoveCarouselSlide = async (slideId, direction) => {
    try {
      const updatedHomeContent = await adminService.moveCarouselSlide(slideId, direction);
      setHomeContent(updatedHomeContent);
    } catch (error) {
      console.error(error);
    }
  };

  const handleToggleProductPriority = async (productId) => {
    try {
      const updatedProduct = await adminService.toggleProductPriority(productId);
      setProducts((previous) =>
        previous.map((product) => (product.id === productId ? updatedProduct : product)),
      );
    } catch (error) {
      console.error(error);
    }
  };

  const handleToggleProductAvailability = async (productId) => {
    try {
      const updatedProduct = await adminService.toggleProductAvailability(productId);
      setProducts((previous) =>
        previous.map((product) => (product.id === productId ? updatedProduct : product)),
      );
    } catch (error) {
      console.error(error);
    }
  };

  const handleToggleFeatured = async (productId) => {
    try {
      const updatedProduct = await adminService.toggleFeatured(productId);
      setProducts((previous) =>
        previous.map((product) => (product.id === productId ? updatedProduct : product)),
      );
    } catch (error) {
      console.error(error);
    }
  };

  const handleSetCategoryOrder = async (categoryId, displayOrder) => {
    try {
      const updatedCategory = await adminService.updateCategoryOrder(categoryId, Number(displayOrder));
      setCategories((previous) =>
        previous.map((category) => (category.id === categoryId ? updatedCategory : category)),
      );
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateHomeMessage = async (fixedMessage) => {
    try {
      const updatedHomeContent = await adminService.updateHomeMessage(fixedMessage);
      setHomeContent(updatedHomeContent);
    } catch (error) {
      console.error(error);
    }
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
            { label: 'Deconnexion', path: '/logout' },
          ]
        : [],
    [session.isAuthenticated],
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
            element={(
              <Home
                homeContent={homeContent}
                categories={sortedCategories}
                featuredProducts={featuredProducts}
                onOpenCategory={handleCategoryNavigation}
                onOpenProduct={handleProductNavigation}
                onNavigate={navigate}
              />
            )}
          />

          <Route
            path="/catalog"
            element={(
              <Category
                categories={sortedCategories}
                activeCategory={activeCategory}
                products={categoryProducts}
                onSelectCategory={handleCategoryNavigation}
                onOpenProduct={handleProductNavigation}
              />
            )}
          />
          <Route
            path="/category/:slug"
            element={(
              <Category
                categories={sortedCategories}
                activeCategory={activeCategory}
                products={categoryProducts}
                onSelectCategory={handleCategoryNavigation}
                onOpenProduct={handleProductNavigation}
              />
            )}
          />
          <Route
            path="/product/:slug"
            element={(
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
            )}
          />
          <Route
            path="/search"
            element={(
              <Search
                categories={sortedCategories}
                criteria={searchState}
                onChangeCriteria={setSearchState}
                results={searchResults}
                onOpenProduct={handleProductNavigation}
              />
            )}
          />
          <Route
            path="/cart"
            element={(
              <Cart
                items={cartDetails}
                summary={cartSummary}
                isAuthenticated={session.isAuthenticated}
                onUpdateQuantity={handleUpdateCartQuantity}
                onRemoveItem={handleRemoveCartItem}
                onNavigate={navigate}
              />
            )}
          />
          <Route
            path="/checkout"
            element={(
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
            )}
          />
          <Route path="/confirmation" element={<Confirmation order={currentOrder} products={products} onNavigate={navigate} />} />
          <Route path="/register" element={<Register onRegister={handleRegister} onNavigate={navigate} />} />
          <Route path="/login" element={<Login onLogin={handleLogin} onNavigate={navigate} />} />
          <Route path="/forgot" element={<ForgotPassword />} />

          <Route
            path="/account"
            element={(
              <RequireAuth isAuthenticated={session.isAuthenticated}>
                <Account user={userProfile} session={session} orders={orders} onSave={handleSaveAccount} onNavigate={navigate} />
              </RequireAuth>
            )}
          />
          <Route
            path="/account/settings"
            element={(
              <RequireAuth isAuthenticated={session.isAuthenticated}>
                <AccountSettings onNavigate={navigate} />
              </RequireAuth>
            )}
          />
          <Route
            path="/account/addresses"
            element={(
              <RequireAuth isAuthenticated={session.isAuthenticated}>
                <AccountAddresses user={userProfile} onNavigate={navigate} />
              </RequireAuth>
            )}
          />
          <Route
            path="/account/payments"
            element={(
              <RequireAuth isAuthenticated={session.isAuthenticated}>
                <AccountPayments user={userProfile} onNavigate={navigate} />
              </RequireAuth>
            )}
          />

          <Route
            path="/orders"
            element={(
              <RequireAuth isAuthenticated={session.isAuthenticated}>
                <OrderHistory orders={orders} products={products} onNavigate={navigate} />
              </RequireAuth>
            )}
          />
          <Route path="/contact" element={<Contact onNavigate={navigate} />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/legal" element={<LegalPage />} />
          <Route path="/about" element={<AboutPage />} />

          <Route
            path="/admin"
            element={(
              <RequireAdmin isAuthenticated={session.isAuthenticated} isAdmin={isAdmin}>
                <AdminLayout />
              </RequireAdmin>
            )}
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard stats={formattedAdminStats} />} />
            <Route path="products" element={<AdminProducts products={products} categories={sortedCategories} onToggleProductPriority={handleToggleProductPriority} onToggleFeatured={handleToggleFeatured} onToggleProductAvailability={handleToggleProductAvailability} />} />
            <Route path="categories" element={<AdminCategories categories={sortedCategories} onSetCategoryOrder={handleSetCategoryOrder} />} />
            <Route path="orders" element={<AdminOrders orders={orders} products={products} onUpdateOrderStatus={handleUpdateOrderStatus} />} />
            <Route
              path="content/home"
              element={(
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
              )}
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
