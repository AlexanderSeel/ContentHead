import { Navigate, Outlet } from 'react-router-dom';

import { isIssueCollectorEnabled } from '../lib/issueCollector';

export function DiagnosticsGuard() {
  if (!isIssueCollectorEnabled()) {
    return <Navigate to="/access-denied" replace />;
  }

  return <Outlet />;
}
