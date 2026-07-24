import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type{ RootState } from '../../store';

interface AdminRouteProps {
  children: React.ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role?.role_name !== 'Admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}