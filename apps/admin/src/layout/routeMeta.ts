export const routeLabels: Record<string, string> = {
  '/': 'Dashboard',
  '/site/overview': 'Site Overview',
  '/site/markets-locales': 'Markets & Locales',
  '/site/content-types': 'Content Types',
  '/build/components': 'Component Registry',
  '/content/pages': 'Pages',
  '/content/templates': 'Templates',
  '/content/routes': 'Routes',
  '/content/assets': 'Assets',
  '/personalization/workflows': 'Personalization Workflows',
  '/personalization/variants': 'Variants',
  '/forms/builder': 'Form Builder',
  '/forms/submissions': 'Form Submissions',
  '/workflows/designer': 'Workflow Designer',
  '/workflows/runs': 'Workflow Runs',
  '/security/users': 'Users',
  '/security/roles': 'Roles',
  '/settings/preferences': 'Preferences',
  '/settings/global/db-admin': 'DB Admin',
  '/settings/global/duckdb': 'DuckDB Admin',
  '/settings/global/connectors/auth': 'Auth Connectors',
  '/settings/global/connectors/db': 'DB Connectors',
  '/settings/global/connectors/dam': 'DAM Connectors',
  '/settings/global/connectors/ai': 'AI Connectors',
  '/dev/graphiql': 'GraphQL / GraphiQL Test',
  '/dev/diagnostics': 'Diagnostics',
  '/extensions/customers': 'Customers & Organisations',
  '/extensions/scheduler': 'Scheduler & Booking',
  '/access-denied': 'Access Denied'
};

export function breadcrumbItems(pathname: string): Array<{ label: string }> {
  if (pathname === '/') {
    return [{ label: 'Dashboard' }];
  }

  const parts = pathname.split('/').filter(Boolean);
  const items: Array<{ label: string }> = [];
  for (let i = 0; i < parts.length; i += 1) {
    const path = `/${parts.slice(0, i + 1).join('/')}`;
    items.push({ label: routeLabels[path] ?? parts[i] ?? path });
  }
  return items;
}
