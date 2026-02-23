export const routeLabels: Record<string, string> = {
  '/': 'Dashboard',
  '/site/overview': 'Site Overview',
  '/site/markets-locales': 'Markets & Locales',
  '/content/pages': 'Pages',
  '/content/templates': 'Templates',
  '/content/routes': 'Routes',
  '/schema/content-types': 'Content Types',
  '/personalization/variants': 'Variants',
  '/forms/builder': 'Form Builder',
  '/workflows/designer': 'Workflow Designer',
  '/workflows/runs': 'Workflow Runs',
  '/security/users': 'Users',
  '/security/roles': 'Roles',
  '/dev/graphiql': 'GraphQL / GraphiQL Test',
  '/dev/diagnostics': 'Diagnostics',
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
