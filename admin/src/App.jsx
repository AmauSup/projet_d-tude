import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Orders from './pages/Orders';
import Users from './pages/Users';
import Support from './pages/Support';
import Homepage from './pages/Homepage';
import Payments from './pages/Payments';
import Settings from './pages/Settings';

export default function App() {
  // TODO: Auth context/provider
  const isAuthenticated = true; // À remplacer par vrai contexte auth

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          isAuthenticated ? (
            <AdminLayout>
              <Routes>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="products/*" element={<Products />} />
                <Route path="categories/*" element={<Categories />} />
                <Route path="orders/*" element={<Orders />} />
                <Route path="users/*" element={<Users />} />
                <Route path="support/*" element={<Support />} />
                <Route path="homepage/*" element={<Homepage />} />
                <Route path="payments/*" element={<Payments />} />
                <Route path="settings/*" element={<Settings />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </AdminLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}
