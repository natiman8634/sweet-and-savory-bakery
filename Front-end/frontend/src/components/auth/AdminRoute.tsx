import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store';
import { restoreSession } from '../../store/authSlice';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const dispatch = useDispatch();
  const { isAuthenticated, user, token } = useSelector((state: RootState) => state.auth);

  // ✅ Debug logs
  console.log('🔐 AdminRoute checking...');
  console.log('🔑 isAuthenticated:', isAuthenticated);
  console.log('👤 User from Redux:', user);
  console.log('👑 User role:', user?.role?.role_name);
  console.log('🔑 Token from Redux:', token);
  console.log('🔑 Token from localStorage:', localStorage.getItem('token'));

  // ✅ Restore session if token exists in localStorage but not in Redux
  useEffect(() => {
    if (!token && localStorage.getItem('token')) {
      console.log('🔄 Restoring session from localStorage');
      dispatch(restoreSession());
    }
  }, [token, dispatch]);

  // ✅ Check if user is authenticated
  if (!isAuthenticated || !token) {
    console.log('❌ Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // ✅ Check if user has admin role (handles both formats)
  const userRole = user?.role?.role_name || user?.role;
  const isAdmin = userRole === 'Admin';
  
  console.log('👑 Is Admin:', isAdmin);

  if (!isAdmin) {
    console.log('❌ Not admin, redirecting to home');
    return <Navigate to="/" replace />;
  }

  console.log('✅ Admin access granted');
  return <>{children}</>;
};

export default AdminRoute;