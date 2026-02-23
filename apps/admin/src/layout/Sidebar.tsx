import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PanelMenu } from 'primereact/panelmenu';

export function Sidebar({ showDevTools }: { showDevTools: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const next: Record<string, boolean> = {};
    const path = location.pathname;
    if (path.startsWith('/site')) next.site = true;
    if (path.startsWith('/content')) next.content = true;
    if (path.startsWith('/settings')) next.settings = true;
    if (path.startsWith('/personalization')) next.personalization = true;
    if (path.startsWith('/forms')) next.forms = true;
    if (path.startsWith('/workflows')) next.workflows = true;
    if (path.startsWith('/security')) next.security = true;
    if (showDevTools && path.startsWith('/dev')) next.devtools = true;
    setExpandedKeys((prev) => ({ ...prev, ...next }));
  }, [location.pathname, showDevTools]);

  const model = useMemo(
    () => [
      { label: 'Dashboard', icon: 'pi pi-home', command: () => navigate('/') },
      {
        key: 'site',
        label: 'Site Settings',
        icon: 'pi pi-cog',
        items: [
          { label: 'Markets & Locales', command: () => navigate('/site/markets-locales') },
          { label: 'Site Overview', command: () => navigate('/site/overview') },
          { label: 'Content Types', command: () => navigate('/site/content-types') }
        ]
      },
      {
        key: 'content',
        label: 'Content',
        icon: 'pi pi-file',
        items: [
          { label: 'Pages', command: () => navigate('/content/pages') },
          { label: 'Templates', command: () => navigate('/content/templates') },
          { label: 'Routes', command: () => navigate('/content/routes') },
          { label: 'Assets (DAM)', command: () => navigate('/content/assets') }
        ]
      },
      {
        key: 'settings',
        label: 'Settings',
        icon: 'pi pi-sliders-h',
        items: [
          { label: 'Preferences', command: () => navigate('/settings/preferences') },
          { label: 'DuckDB Admin', command: () => navigate('/settings/global/duckdb') },
          { label: 'Auth', command: () => navigate('/settings/global/connectors/auth') },
          { label: 'DB', command: () => navigate('/settings/global/connectors/db') },
          { label: 'DAM', command: () => navigate('/settings/global/connectors/dam') },
          { label: 'AI', command: () => navigate('/settings/global/connectors/ai') }
        ]
      },
      {
        key: 'personalization',
        label: 'Personalization',
        icon: 'pi pi-chart-line',
        items: [{ label: 'Variants', command: () => navigate('/personalization/variants') }]
      },
      {
        key: 'forms',
        label: 'Forms',
        icon: 'pi pi-list-check',
        items: [{ label: 'Form Builder', command: () => navigate('/forms/builder') }]
      },
      {
        key: 'workflows',
        label: 'Workflows',
        icon: 'pi pi-share-alt',
        items: [
          { label: 'Designer', command: () => navigate('/workflows/designer') },
          { label: 'Runs', command: () => navigate('/workflows/runs') }
        ]
      },
      {
        key: 'security',
        label: 'Security',
        icon: 'pi pi-shield',
        items: [
          { label: 'Users', command: () => navigate('/security/users') },
          { label: 'Roles', command: () => navigate('/security/roles') }
        ]
      },
      ...(showDevTools
        ? [
            {
              key: 'devtools',
              label: 'Dev Tools',
              icon: 'pi pi-wrench',
              items: [
                { label: 'GraphQL / GraphiQL', command: () => navigate('/dev/graphiql') },
                { label: 'Diagnostics', command: () => navigate('/dev/diagnostics') }
              ]
            }
          ]
        : [])
    ],
    [navigate, showDevTools]
  );

  return (
    <aside className="admin-sidebar">
      <PanelMenu
        model={model}
        multiple
        expandedKeys={expandedKeys}
        onExpandedKeysChange={(event) => setExpandedKeys((event.value as Record<string, boolean>) ?? {})}
      />
    </aside>
  );
}
