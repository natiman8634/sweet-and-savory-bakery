import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Products from './pages/Products';
import Login from './pages/Login';
import Register from './pages/Register';

// ✅ Protected Route Component
function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role !== 'Admin') {
    return <Navigate to="/" replace />;
  }
  
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ✅ All routes are now wrapped in Layout */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="products" element={<Products />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          
          {/* Protected Routes */}
          <Route
            path="cart"
            element={
              <ProtectedRoute>
                <div>🛒 Shopping Cart (coming soon)</div>
              </ProtectedRoute>
            }
          />
          <Route
            path="checkout"
            element={
              <ProtectedRoute>
                <div>📦 Checkout (coming soon)</div>
              </ProtectedRoute>
            }
          />
          
          {/* Admin Routes */}
          <Route
            path="admin/dashboard"
            element={
              <ProtectedRoute adminOnly>
                <div>📊 Admin Dashboard (coming soon)</div>
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/products"
            element={
              <ProtectedRoute adminOnly>
                <div>📦 Manage Products (coming soon)</div>
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/orders"
            element={
              <ProtectedRoute adminOnly>
                <div>📋 Manage Orders (coming soon)</div>
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