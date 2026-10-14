import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Products, { AdminProducts } from './pages/Products';
import Login from './pages/Login';
import Register from './pages/Register';
import Cart from './pages/Cart';
import Profile from './pages/Profile';
import Orders, { AdminOrders } from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import ProductDetail from './pages/ProductDetail';
import Checkout from './pages/Checkout';
import AdminDashboard from './pages/admin/Dashboard';

import AdminUsers from './pages/admin/Users';
import AdminReviews from './pages/admin/Reviews';

// ✅ Protected Route Component
// `allowedRoles` = who may view the page. Omit it for any logged-in user.
function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role || '')) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// Back-office roles: Admin has full access, Staff handles orders and stock
const BACK_OFFICE_ROLES = ['Admin', 'Staff'];
const ADMIN_ONLY = ['Admin'];

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ✅ All routes wrapped in Layout */}
        <Route path="/" element={<Layout />}>
          {/* Public Routes */}
          <Route index element={<Home />} />
          <Route path="products" element={<Products />} />
          <Route path="products/:id" element={<ProductDetail />} />
          <Route path="cart" element={<Cart />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />

          {/* Protected Routes */}
          <Route
            path="checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route
            path="profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="orders"
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            }
          />
          <Route
            path="orders/:id"
            element={
              <ProtectedRoute>
                <OrderDetail />
              </ProtectedRoute>
            }
          />

          {/* Admin / Staff Routes */}
          <Route
            path="admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={BACK_OFFICE_ROLES}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/orders"
            element={
              <ProtectedRoute allowedRoles={BACK_OFFICE_ROLES}>
                <AdminOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/products"
            element={
              <ProtectedRoute allowedRoles={BACK_OFFICE_ROLES}>
                <AdminProducts />
              </ProtectedRoute>
            }
          />

          {/* Admin-only Routes */}
          <Route
            path="admin/users"
            element={
              <ProtectedRoute allowedRoles={ADMIN_ONLY}>
                <AdminUsers />
              </ProtectedRoute>
            }
          />

          <Route
            path="admin/reviews"
            element={
              <ProtectedRoute allowedRoles={ADMIN_ONLY}>
                <AdminReviews />
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<div className="p-8 text-center">Page not found</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;