import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Button } from 'primereact/button';

export function Sidebar({ showDevTools }: { showDevTools: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();
  const sections = useMemo(
    () => [
      {
        key: 'site',
        label: 'Site Settings',
        items: [
          { label: 'Markets & Locales', to: '/site/markets-locales' },
          { label: 'Site Overview', to: '/site/overview' },
          { label: 'Content Types', to: '/site/content-types' }
        ]
      },
      {
        key: 'content',
        label: 'Content',
        items: [
          { label: 'Pages', to: '/content/pages' },
          { label: 'Templates', to: '/content/templates' },
          { label: 'Routes', to: '/content/routes' },
          { label: 'Assets (DAM)', to: '/content/assets' }
        ]
      },
      {
        key: 'settings',
        label: 'Settings',
        items: [
          { label: 'Preferences', to: '/settings/preferences' },
          { label: 'DuckDB Admin', to: '/settings/global/duckdb' },
          { label: 'Auth', to: '/settings/global/connectors/auth' },
          { label: 'DB', to: '/settings/global/connectors/db' },
          { label: 'DAM', to: '/settings/global/connectors/dam' },
          { label: 'AI', to: '/settings/global/connectors/ai' }
        ]
      },
      {
        key: 'personalization',
        label: 'Personalization',
        items: [{ label: 'Variants', to: '/personalization/variants' }]
      },
      {
        key: 'forms',
        label: 'Forms',
        items: [
          { label: 'Form Builder', to: '/forms/builder' },
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
                { label: 'GraphQL / GraphiQL', to: '/dev/graphiql' },
                { label: 'Diagnostics', to: '/dev/diagnostics' }
              ]
            }
          ]
        : [])
    ],
    [showDevTools]
  );

  const defaultOpen = useMemo(() => {
    const path = location.pathname;
    return sections
      .map((section, index) => {
        const hasCurrent = section.items.some((item) => path.startsWith(item.to));
        return hasCurrent ? index : -1;
      })
      .filter((value) => value >= 0);
  }, [location.pathname, sections]);
  const [activeIndex, setActiveIndex] = useState<number[] | number | null>(defaultOpen);

  return (
    <aside className="admin-sidebar">
      <div className="form-row" style={{ marginBottom: '0.75rem' }}>
        <Button label="Dashboard" icon="pi pi-home" text={location.pathname !== '/'} onClick={() => navigate('/')} />
      </div>
      <Accordion multiple activeIndex={activeIndex} onTabChange={(event) => setActiveIndex(event.index)}>
        {sections.map((section) => (
          <AccordionTab key={section.key} header={section.label}>
            <div className="form-row">
              {section.items.map((item) => {
                const selected = location.pathname.startsWith(item.to);
                return (
                  <Button
                    key={item.to}
                    label={item.label}
                    text={!selected}
                    severity={selected ? 'contrast' : undefined}
                    onClick={() => navigate(item.to)}
                    style={{ justifyContent: 'flex-start' }}
                  />
                );
              })}
            </div>
          </AccordionTab>
        ))}
      </Accordion>
    </aside>
  );
}
