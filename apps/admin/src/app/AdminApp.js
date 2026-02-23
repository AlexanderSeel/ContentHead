import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    return (_jsx(AuthProvider, { children: _jsx(BrowserRouter, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(LoginPage, {}) }), _jsx(Route, { path: "/access-denied", element: _jsx(AccessDeniedPage, {}) }), _jsx(Route, { element: _jsx(AuthGuard, {}), children: _jsxs(Route, { element: _jsx(AdminProvider, { children: _jsx(AdminShell, {}) }), children: [_jsx(Route, { path: "/", element: _jsx(DashboardPage, {}) }), _jsx(Route, { path: "/site/overview", element: _jsx(SiteOverviewPage, {}) }), _jsx(Route, { path: "/site/markets-locales", element: _jsx(MarketsLocalesPage, {}) }), _jsx(Route, { path: "/site", element: _jsx(Navigate, { to: "/site/overview", replace: true }) }), _jsx(Route, { path: "/content/pages", element: _jsx(ContentPagesPage, {}) }), _jsx(Route, { path: "/content/templates", element: _jsx(TemplatesPage, {}) }), _jsx(Route, { path: "/content/routes", element: _jsx(RoutesPage, {}) }), _jsx(Route, { path: "/content", element: _jsx(Navigate, { to: "/content/pages", replace: true }) }), _jsx(Route, { path: "/schema/content-types", element: _jsx(ContentTypesPage, {}) }), _jsx(Route, { path: "/schema", element: _jsx(Navigate, { to: "/schema/content-types", replace: true }) }), _jsx(Route, { path: "/personalization/variants", element: _jsx(VariantsPage, {}) }), _jsx(Route, { path: "/personalization", element: _jsx(Navigate, { to: "/personalization/variants", replace: true }) }), _jsx(Route, { path: "/forms/builder", element: _jsx(FormBuilderPage, {}) }), _jsx(Route, { path: "/forms", element: _jsx(Navigate, { to: "/forms/builder", replace: true }) }), _jsx(Route, { path: "/workflows/designer", element: _jsx(WorkflowDesignerPage, {}) }), _jsx(Route, { path: "/workflows/runs", element: _jsx(WorkflowRunsPage, {}) }), _jsx(Route, { path: "/workflows", element: _jsx(Navigate, { to: "/workflows/designer", replace: true }) }), _jsx(Route, { path: "/security/users", element: _jsx(UsersPage, {}) }), _jsx(Route, { path: "/security/roles", element: _jsx(RolesPage, {}) }), _jsx(Route, { path: "/security", element: _jsx(Navigate, { to: "/security/users", replace: true }) }), _jsxs(Route, { element: _jsx(DevGuard, {}), children: [_jsx(Route, { path: "/dev/graphiql", element: _jsx(GraphiQLPage, {}) }), _jsx(Route, { path: "/dev/diagnostics", element: _jsx(DiagnosticsPage, {}) })] }), _jsx(Route, { path: "*", element: _jsx(NotFoundPage, {}) })] }) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) })] }) }) }));
}
