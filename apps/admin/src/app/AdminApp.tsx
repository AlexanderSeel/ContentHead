import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AuthProvider } from './AuthContext';
import { AdminProvider } from './AdminContext';
import { AdminShell } from '../layout/AdminShell';
import { LoginPage } from '../routes/LoginPage';
import { AuthGuard } from '../routes/AuthGuard';
import { DevGuard } from '../routes/DevGuard';
import { DashboardPage } from '../routes/DashboardPage';
import { AccessDeniedPage } from '../routes/AccessDeniedPage';
import { NotFoundPage } from '../routes/NotFoundPage';
import { SiteOverviewPage } from '../features/siteSettings/SiteOverviewPage';
import { MarketsLocalesPage } from '../features/siteSettings/MarketsLocalesPage';
import { ContentPagesPage } from '../features/content/ContentPagesPage';
import { TemplatesPage } from '../features/content/TemplatesPage';
import { RoutesPage } from '../features/content/RoutesPage';
import { ContentTypesPage } from '../features/schema/ContentTypesPage';
import { VariantsPage } from '../features/personalization/VariantsPage';
import { FormBuilderPage } from '../features/forms/FormBuilderPage';
import { WorkflowDesignerPage } from '../features/workflows/WorkflowDesignerPage';
import { WorkflowRunsPage } from '../features/workflows/WorkflowRunsPage';
import { UsersPage } from '../features/security/UsersPage';
import { RolesPage } from '../features/security/RolesPage';
import { GraphiQLPage } from '../features/devtools/GraphiQLPage';
import { DiagnosticsPage } from '../features/devtools/DiagnosticsPage';

export function AdminApp() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/access-denied" element={<AccessDeniedPage />} />

          <Route element={<AuthGuard />}>
            <Route
              element={
                <AdminProvider>
                  <AdminShell />
                </AdminProvider>
              }
            >
              <Route path="/" element={<DashboardPage />} />

              <Route path="/site/overview" element={<SiteOverviewPage />} />
              <Route path="/site/markets-locales" element={<MarketsLocalesPage />} />
              <Route path="/site" element={<Navigate to="/site/overview" replace />} />

              <Route path="/content/pages/:contentItemId" element={<ContentPagesPage />} />
              <Route path="/content/pages" element={<ContentPagesPage />} />
              <Route path="/content/templates" element={<TemplatesPage />} />
              <Route path="/content/routes" element={<RoutesPage />} />
              <Route path="/content" element={<Navigate to="/content/pages" replace />} />

              <Route path="/schema/content-types" element={<ContentTypesPage />} />
              <Route path="/schema" element={<Navigate to="/schema/content-types" replace />} />

              <Route path="/personalization/variants" element={<VariantsPage />} />
              <Route path="/personalization" element={<Navigate to="/personalization/variants" replace />} />

              <Route path="/forms/builder" element={<FormBuilderPage />} />
              <Route path="/forms" element={<Navigate to="/forms/builder" replace />} />

              <Route path="/workflows/designer" element={<WorkflowDesignerPage />} />
              <Route path="/workflows/runs" element={<WorkflowRunsPage />} />
              <Route path="/workflows" element={<Navigate to="/workflows/designer" replace />} />

              <Route path="/security/users" element={<UsersPage />} />
              <Route path="/security/roles" element={<RolesPage />} />
              <Route path="/security" element={<Navigate to="/security/users" replace />} />

              <Route element={<DevGuard />}>
                <Route path="/dev/graphiql" element={<GraphiQLPage />} />
                <Route path="/dev/diagnostics" element={<DiagnosticsPage />} />
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
