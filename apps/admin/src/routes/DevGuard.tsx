import { Navigate, Outlet } from 'react-router-dom';

export function DevGuard() {
  if (!import.meta.env.DEV) {
    return <Navigate to="/access-denied" replace />;
  }

  return <Outlet />;
}
