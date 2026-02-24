import { Card } from 'primereact/card';

import { useAdminContext } from '../../app/AdminContext';
import { useUi } from '../../app/UiContext';
import { useGraphqlDiagnostics } from '../../lib/graphqlReliability';
import { readCssVar } from '../../theme/themeManager';
import { WorkspaceBody, WorkspaceHeader, WorkspacePage } from '../../ui/molecules';

export function DiagnosticsPage() {
  const { siteId, marketCode, localeCode, error } = useAdminContext();
  const { theme, scale, themeMode, themeBridge } = useUi();
  const graphqlErrors = useGraphqlDiagnostics();
  const tokens = [
    '--surface-ground',
    '--surface-card',
    '--surface-overlay',
    '--surface-border',
    '--text-color',
    '--text-color-secondary',
    '--primary-color'
  ];

  return (
    <WorkspacePage>
      <WorkspaceHeader title="Diagnostics" subtitle="Build, GraphQL, and theme diagnostics." />
      <WorkspaceBody>
        <div className="pane paneScroll form-row">
      <Card>
        <div className="diagnostics-grid">
          <div className="status-panel"><strong>Site</strong><div>#{siteId}</div></div>
          <div className="status-panel"><strong>Market</strong><div>{marketCode}</div></div>
          <div className="status-panel"><strong>Locale</strong><div>{localeCode}</div></div>
          <div className="status-panel"><strong>Theme</strong><div>{theme}</div></div>
          <div className="status-panel"><strong>Theme Mode</strong><div>{themeMode}</div></div>
          <div className="status-panel"><strong>Monaco Theme</strong><div>{themeBridge.monacoTheme}</div></div>
          <div className="status-panel"><strong>Scale</strong><div>{scale}px</div></div>
          <div className="status-panel"><strong>API</strong><div>{import.meta.env.VITE_API_URL ?? 'http://localhost:4000/graphql'}</div></div>
          <div className="status-panel"><strong>Mode</strong><div>{import.meta.env.MODE}</div></div>
          <div className="status-panel"><strong>Build</strong><div>{import.meta.env.VITE_BUILD_SHA ?? 'local-dev'}</div></div>
          <div className="status-panel"><strong>Context Error</strong><div>{error ?? 'none'}</div></div>
        </div>
      </Card>
      <Card title="GraphQL Errors (Last 20)">
        {graphqlErrors.length === 0 ? (
          <div className="status-panel">No GraphQL errors captured.</div>
        ) : (
          <div className="diagnostics-error-list">
            {graphqlErrors.map((entry) => (
              <div key={`${entry.timestamp}-${entry.operationName}`} className="status-panel diagnostics-error-item">
                <strong>{entry.operationName}</strong>
                <div>{entry.message}</div>
                <small>{new Date(entry.timestamp).toLocaleString()}</small>
                <pre>{JSON.stringify(entry.variables, null, 2)}</pre>
              </div>
            ))}
          </div>
        )}
      </Card>
      <Card title="Theme Diagnostics">
        <div className="diagnostics-grid">
          {tokens.map((tokenName) => (
            <div key={tokenName} className="status-panel">
              <strong>{tokenName}</strong>
              <div>{readCssVar(tokenName) || '(not set)'}</div>
            </div>
          ))}
        </div>
      </Card>
        </div>
      </WorkspaceBody>
    </WorkspacePage>
  );
}
