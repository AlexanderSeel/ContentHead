import { Card } from 'primereact/card';

import { PageHeader } from '../../components/common/PageHeader';
import { useAdminContext } from '../../app/AdminContext';
import { useUi } from '../../app/UiContext';

export function DiagnosticsPage() {
  const { siteId, marketCode, localeCode } = useAdminContext();
  const { theme, scale } = useUi();

  return (
    <div>
      <PageHeader title="Diagnostics" subtitle="Build and environment info" />
      <Card>
        <div className="diagnostics-grid">
          <div className="status-panel"><strong>Site</strong><div>#{siteId}</div></div>
          <div className="status-panel"><strong>Market</strong><div>{marketCode}</div></div>
          <div className="status-panel"><strong>Locale</strong><div>{localeCode}</div></div>
          <div className="status-panel"><strong>Theme</strong><div>{theme}</div></div>
          <div className="status-panel"><strong>Scale</strong><div>{scale}px</div></div>
          <div className="status-panel"><strong>API</strong><div>{import.meta.env.VITE_API_URL ?? 'http://localhost:4000/graphql'}</div></div>
          <div className="status-panel"><strong>Mode</strong><div>{import.meta.env.MODE}</div></div>
          <div className="status-panel"><strong>Build</strong><div>{import.meta.env.VITE_BUILD_SHA ?? 'local-dev'}</div></div>
        </div>
      </Card>
    </div>
  );
}
