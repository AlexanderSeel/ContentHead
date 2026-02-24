import { useEffect, useMemo, useState } from 'react';
import { Card } from 'primereact/card';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { buildLocalizedPath, validateUrlPattern } from '@contenthead/shared';

import { useAdminContext } from '../../app/AdminContext';
import { createAdminSdk } from '../../lib/sdk';
import { useAuth } from '../../app/AuthContext';
import { useUi } from '../../app/UiContext';
import { WorkspaceBody, WorkspaceHeader, WorkspacePage } from '../../ui/molecules';

const URL_PATTERN_PRESETS = [
  { label: '/{market}/{locale}/...', value: '/{market}/{locale}' },
  { label: '/{market}-{locale}/...', value: '/{market}-{locale}' },
  { label: '/{locale}/{market}/...', value: '/{locale}/{market}' },
  { label: 'Custom', value: '__custom__' }
];

export function SiteOverviewPage() {
  const { token } = useAuth();
  const sdk = useMemo(() => createAdminSdk(token), [token]);
  const { siteId, marketCode, localeCode, sites, refreshContext } = useAdminContext();
  const { toast } = useUi();
  const site = sites.find((entry) => entry.id === siteId);
  const [customPattern, setCustomPattern] = useState(site?.urlPattern ?? '/{market}/{locale}');
  const [patternMode, setPatternMode] = useState<string>(
    URL_PATTERN_PRESETS.find((entry) => entry.value === (site?.urlPattern ?? ''))?.value ?? '__custom__'
  );

  useEffect(() => {
    if (!site) {
      return;
    }
    setCustomPattern(site.urlPattern);
    setPatternMode(URL_PATTERN_PRESETS.find((entry) => entry.value === site.urlPattern)?.value ?? '__custom__');
  }, [site?.id, site?.urlPattern]);

  const effectivePattern = patternMode === '__custom__' ? customPattern : patternMode;
  const validation = validateUrlPattern(effectivePattern);
  const preview = buildLocalizedPath(effectivePattern, marketCode.toLowerCase(), localeCode.toLowerCase(), 'start');

  return (
    <WorkspacePage>
      <WorkspaceHeader title="Site Overview" subtitle="Current tenant context, defaults and URL rewriting." />
      <WorkspaceBody>
        <Card className="pane paneScroll">
        <div className="form-grid">
          <div className="status-panel"><strong>Site</strong><div>{site?.name ?? `#${siteId}`}</div></div>
          <div className="status-panel"><strong>Current Market</strong><div>{marketCode}</div></div>
          <div className="status-panel"><strong>Current Locale</strong><div>{localeCode}</div></div>
        </div>

        <h3>URL Pattern</h3>
        <div className="form-grid">
          <Dropdown
            value={patternMode}
            options={URL_PATTERN_PRESETS}
            onChange={(event) => {
              const value = String(event.value);
              setPatternMode(value);
              if (value !== '__custom__') {
                setCustomPattern(value);
              }
            }}
          />
          <InputText
            value={customPattern}
            onChange={(event) => setCustomPattern(event.target.value)}
            disabled={patternMode !== '__custom__'}
            placeholder="/{market}/{locale}"
          />
          <Button
            label="Save Pattern"
            disabled={!validation.valid}
            onClick={() =>
              sdk
                .setSiteUrlPattern({
                  siteId,
                  urlPattern: effectivePattern
                })
                .then(async () => {
                  await refreshContext();
                  toast({ severity: 'success', summary: 'Site URL pattern updated' });
                })
            }
          />
        </div>
        {!validation.valid ? <small className="editor-error">{validation.error}</small> : null}
        <div className="status-panel">Example preview: {preview}</div>
        </Card>
      </WorkspaceBody>
    </WorkspacePage>
  );
}
