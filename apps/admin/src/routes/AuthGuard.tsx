import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '../app/AuthContext';

export function AuthGuard() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
}
