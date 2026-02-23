export const routeLabels = {
    '/': 'Dashboard',
    '/site/overview': 'Site Overview',
    '/site/markets-locales': 'Markets & Locales',
    '/site/content-types': 'Content Types',
    '/content/pages': 'Pages',
    '/content/templates': 'Templates',
    '/content/routes': 'Routes',
    '/content/assets': 'Assets',
    '/personalization/variants': 'Variants',
    '/forms/builder': 'Form Builder',
    '/workflows/designer': 'Workflow Designer',
    '/workflows/runs': 'Workflow Runs',
    '/security/users': 'Users',
    '/security/roles': 'Roles',
    '/settings/global/connectors/auth': 'Auth Connectors',
    '/settings/global/connectors/db': 'DB Connectors',
    '/settings/global/connectors/dam': 'DAM Connectors',
    '/settings/global/connectors/ai': 'AI Connectors',
    '/dev/graphiql': 'GraphQL / GraphiQL Test',
    '/dev/diagnostics': 'Diagnostics',
    '/access-denied': 'Access Denied'
};
export function breadcrumbItems(pathname) {
    if (pathname === '/') {
        return [{ label: 'Dashboard' }];
    }
    const parts = pathname.split('/').filter(Boolean);
    const items = [];
    for (let i = 0; i < parts.length; i += 1) {
        const path = `/${parts.slice(0, i + 1).join('/')}`;
        items.push({ label: routeLabels[path] ?? parts[i] ?? path });
    }
    return items;
}
