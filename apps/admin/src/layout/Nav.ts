import { extensionNavItems } from '../extensions/core/registry';

export type NavItem = {
  label: string;
  to: string;
  matchPrefix?: string;
  icon?: string;
};

export type NavArea = {
  key: string;
  label: string;
  icon: string;
  items: NavItem[];
};

export function buildNavAreas(showDevTools: boolean): NavArea[] {
  const baseAreas: NavArea[] = [
    {
      key: 'content',
      label: 'Content',
      icon: 'pi pi-file',
      items: [
        { label: 'Pages', to: '/content/pages', icon: 'pi pi-copy' },
        { label: 'Routes', to: '/content/routes', icon: 'pi pi-sitemap' }
      ]
    },
    {
      key: 'build',
      label: 'Build',
      icon: 'pi pi-wrench',
      items: [
        { label: 'Content Types', to: '/site/content-types', icon: 'pi pi-list' },
        { label: 'Templates', to: '/content/templates', icon: 'pi pi-clone' },
        { label: 'Components', to: '/build/components', icon: 'pi pi-th-large' }
      ]
    },
    {
      key: 'personalization',
      label: 'Personalization',
      icon: 'pi pi-sliders-h',
      items: [
        { label: 'Workflows', to: '/personalization/workflows', matchPrefix: '/personalization/workflows', icon: 'pi pi-share-alt' },
        { label: 'Variants', to: '/personalization/variants', matchPrefix: '/personalization/variants', icon: 'pi pi-percentage' },
        { label: 'Visitor Groups', to: '/personalization/visitor-groups', matchPrefix: '/personalization/visitor-groups', icon: 'pi pi-users' }
      ]
    },
    {
      key: 'forms',
      label: 'Forms',
      icon: 'pi pi-check-square',
      items: [
        { label: 'Builder', to: '/forms/builder', icon: 'pi pi-pencil' },
        { label: 'Submissions', to: '/forms/submissions', icon: 'pi pi-inbox' }
      ]
    },
    {
      key: 'workflows',
      label: 'Workflows',
      icon: 'pi pi-directions-alt',
      items: [
        { label: 'Designer', to: '/workflows/designer', icon: 'pi pi-sitemap' },
        { label: 'Runs', to: '/workflows/runs', icon: 'pi pi-history' }
      ]
    },
    {
      key: 'assets',
      label: 'Assets',
      icon: 'pi pi-images',
      items: [{ label: 'Library', to: '/content/assets', icon: 'pi pi-folder-open' }]
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: 'pi pi-cog',
      items: [
        { label: 'Connectors (Auth)', to: '/settings/global/connectors/auth', icon: 'pi pi-id-card' },
        { label: 'Connectors (DB)', to: '/settings/global/connectors/db', icon: 'pi pi-database' },
        { label: 'Connectors (DAM)', to: '/settings/global/connectors/dam', icon: 'pi pi-images' },
        { label: 'Connectors (AI)', to: '/settings/global/connectors/ai', icon: 'pi pi-sparkles' },
        { label: 'DB Admin', to: '/settings/global/db-admin', icon: 'pi pi-table' },
        { label: 'DuckDB Admin', to: '/settings/global/duckdb', icon: 'pi pi-server' },
        { label: 'Preferences', to: '/settings/preferences', icon: 'pi pi-sliders-h' }
      ]
    },
    {
      key: 'security',
      label: 'Security',
      icon: 'pi pi-shield',
      items: [
        { label: 'Users', to: '/security/users', icon: 'pi pi-users' },
        { label: 'Roles', to: '/security/roles', icon: 'pi pi-lock' },
        { label: 'Groups', to: '/security/groups', icon: 'pi pi-sitemap' }
      ]
    },
    {
      key: 'devtools',
      label: 'Dev Tools',
      icon: 'pi pi-wrench',
      items: showDevTools
        ? [
            { label: 'GraphiQL', to: '/dev/graphiql', icon: 'pi pi-code' },
            { label: 'Diagnostics', to: '/dev/diagnostics', icon: 'pi pi-heart' }
          ]
        : [{ label: 'Diagnostics', to: '/dev/diagnostics', icon: 'pi pi-heart' }]
    }
  ];

  for (const item of extensionNavItems) {
    const area = baseAreas.find((entry) => entry.key === item.areaKey);
    if (area) {
      area.items.push({
        label: item.label,
        to: item.to,
        icon: 'pi pi-link',
        ...(item.matchPrefix ? { matchPrefix: item.matchPrefix } : {})
      });
      continue;
    }
    baseAreas.push({
      key: item.areaKey,
      label: item.areaLabel,
      icon: 'pi pi-box',
      items: [{ label: item.label, to: item.to, icon: 'pi pi-link', ...(item.matchPrefix ? { matchPrefix: item.matchPrefix } : {}) }]
    });
  }

  return baseAreas;
}

export function areaForPath(pathname: string, areas: NavArea[]): NavArea {
  const matched =
    areas.find((area) => area.items.some((item) => pathname.startsWith(item.matchPrefix ?? item.to))) ?? areas[0];
  return matched ?? {
    key: 'content',
    label: 'Content',
    icon: 'pi pi-file',
    items: [{ label: 'Pages', to: '/content/pages' }]
  };
}
