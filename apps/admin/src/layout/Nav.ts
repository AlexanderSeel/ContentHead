export type NavItem = {
  label: string;
  to: string;
  matchPrefix?: string;
};

export type NavArea = {
  key: string;
  label: string;
  items: NavItem[];
};

export function buildNavAreas(showDevTools: boolean): NavArea[] {
  return [
    {
      key: 'content',
      label: 'Content',
      items: [
        { label: 'Pages', to: '/content/pages' },
        { label: 'Routes', to: '/content/routes' }
      ]
    },
    {
      key: 'build',
      label: 'Build',
      items: [
        { label: 'Content Types', to: '/site/content-types' },
        { label: 'Templates', to: '/content/templates' },
        { label: 'Components (Registry)', to: '/content/pages', matchPrefix: '/content/pages' }
      ]
    },
    {
      key: 'personalization',
      label: 'Personalization',
      items: [
        { label: 'Variants', to: '/personalization/variants' },
        { label: 'Targeting Rules', to: '/personalization/variants', matchPrefix: '/personalization/variants' },
        { label: 'Personalization Workflows', to: '/workflows/designer', matchPrefix: '/workflows/designer' }
      ]
    },
    {
      key: 'forms',
      label: 'Forms',
      items: [
        { label: 'Builder', to: '/forms/builder' },
        { label: 'Submissions', to: '/forms/submissions' }
      ]
    },
    {
      key: 'workflows',
      label: 'Workflows',
      items: [
        { label: 'Designer', to: '/workflows/designer' },
        { label: 'Runs', to: '/workflows/runs' }
      ]
    },
    {
      key: 'assets',
      label: 'Assets (DAM)',
      items: [{ label: 'Library', to: '/content/assets' }]
    },
    {
      key: 'settings',
      label: 'Settings',
      items: [
        { label: 'Connectors (Auth)', to: '/settings/global/connectors/auth' },
        { label: 'Connectors (DB)', to: '/settings/global/connectors/db' },
        { label: 'Connectors (DAM)', to: '/settings/global/connectors/dam' },
        { label: 'Connectors (AI)', to: '/settings/global/connectors/ai' },
        { label: 'DB Admin', to: '/settings/global/db-admin' },
        { label: 'DuckDB Admin', to: '/settings/global/duckdb' }
      ]
    },
    {
      key: 'security',
      label: 'Security',
      items: [
        { label: 'Users', to: '/security/users' },
        { label: 'Roles', to: '/security/roles' }
      ]
    },
    ...(showDevTools
      ? [
          {
            key: 'devtools',
            label: 'Dev Tools',
            items: [
              { label: 'GraphiQL', to: '/dev/graphiql' },
              { label: 'Diagnostics', to: '/dev/diagnostics' }
            ]
          } satisfies NavArea
        ]
      : [])
  ];
}

export function areaForPath(pathname: string, areas: NavArea[]): NavArea {
  const matched =
    areas.find((area) => area.items.some((item) => pathname.startsWith(item.matchPrefix ?? item.to))) ?? areas[0];
  return matched ?? {
    key: 'content',
    label: 'Content',
    items: [{ label: 'Pages', to: '/content/pages' }]
  };
}
