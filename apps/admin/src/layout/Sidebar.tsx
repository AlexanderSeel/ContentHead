import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PanelMenu } from 'primereact/panelmenu';

export function Sidebar({ showDevTools }: { showDevTools: boolean }) {
  const navigate = useNavigate();

  const model = useMemo(
    () => [
      { label: 'Dashboard', icon: 'pi pi-home', command: () => navigate('/') },
      {
        label: 'Site Settings',
        icon: 'pi pi-cog',
        items: [
          { label: 'Markets & Locales', command: () => navigate('/site/markets-locales') },
          { label: 'Site Overview', command: () => navigate('/site/overview') }
        ]
      },
      {
        label: 'Content',
        icon: 'pi pi-file',
        items: [
          { label: 'Pages', command: () => navigate('/content/pages') },
          { label: 'Templates', command: () => navigate('/content/templates') },
          { label: 'Routes', command: () => navigate('/content/routes') }
        ]
      },
      {
        label: 'Schema',
        icon: 'pi pi-sitemap',
        items: [{ label: 'Content Types', command: () => navigate('/schema/content-types') }]
      },
      {
        label: 'Personalization',
        icon: 'pi pi-sliders-h',
        items: [{ label: 'Variants', command: () => navigate('/personalization/variants') }]
      },
      {
        label: 'Forms',
        icon: 'pi pi-list-check',
        items: [{ label: 'Form Builder', command: () => navigate('/forms/builder') }]
      },
      {
        label: 'Workflows',
        icon: 'pi pi-share-alt',
        items: [
          { label: 'Designer', command: () => navigate('/workflows/designer') },
          { label: 'Runs', command: () => navigate('/workflows/runs') }
        ]
      },
      {
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
      <PanelMenu model={model} />
    </aside>
  );
}
