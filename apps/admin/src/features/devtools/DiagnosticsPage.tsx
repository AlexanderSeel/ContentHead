import { Accordion, AccordionTab } from 'primereact/accordion';
import { Card } from 'primereact/card';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { TabPanel, TabView } from 'primereact/tabview';
import { useEffect, useMemo, useState } from 'react';

import { Button, NumberInput, Select, Switch, TextInput } from '../../ui/atoms';

import { useAdminContext } from '../../app/AdminContext';
import { useUi } from '../../app/UiContext';
import { useAuth } from '../../app/AuthContext';
import {
  type IssueEntry,
  type IssueLevel,
  type IssueSource,
  issueCollector,
  useIssueCollectorState
} from '../../lib/issueCollector';
import { useGraphqlDiagnostics } from '../../lib/graphqlReliability';
import { createAdminSdk } from '../../lib/sdk';
import { readCssVar } from '../../theme/themeManager';
import { ForbiddenState, WorkspaceBody, WorkspaceHeader, WorkspacePage } from '../../ui/molecules';
import { usePreviewDiagnostics } from '../content/previewDiagnostics';

const LEVEL_OPTIONS: Array<{ label: string; value: 'all' | IssueLevel }> = [
  { label: 'All levels', value: 'all' },
  { label: 'Error', value: 'error' },
  { label: 'Warn', value: 'warn' }
];

const SOURCE_OPTIONS: Array<{ label: string; value: 'all' | IssueSource }> = [
  { label: 'All sources', value: 'all' },
  { label: 'Console', value: 'console' },
  { label: 'Toast', value: 'toast' },
  { label: 'GraphQL', value: 'graphql' },
  { label: 'Runtime', value: 'runtime' }
];

export function DiagnosticsPage() {
  const { siteId, marketCode, localeCode, error } = useAdminContext();
  const { theme, scale, themeMode, themeBridge, toast } = useUi();
  const graphqlErrors = useGraphqlDiagnostics();
  const { token } = useAuth();
  const sdk = useMemo(() => createAdminSdk(token), [token]);
  const previewDiagnostics = usePreviewDiagnostics();
  const collectorState = useIssueCollectorState();
  const [activeTab, setActiveTab] = useState(0);
  const [securityInfo, setSecurityInfo] = useState<{
    roles: string[];
    permissions: string[];
    seedStatus: {
      adminRoleExists: boolean;
      adminPermissionCoverage: boolean;
      adminUserHasRole: boolean;
    };
  } | null>(null);
  const [securityError, setSecurityError] = useState<string | null>(null);
  const [levelFilter, setLevelFilter] = useState<'all' | IssueLevel>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | IssueSource>('all');
  const [routeFilter, setRouteFilter] = useState('');
  const [selectedIssue, setSelectedIssue] = useState<IssueEntry | null>(null);
  const [maxEntriesDraft, setMaxEntriesDraft] = useState<number>(collectorState.maxEntries);
  const [exportBuffer, setExportBuffer] = useState('');
  const [overviewSections, setOverviewSections] = useState<number[] | number | null>([0, 1]);
  const [graphqlSections, setGraphqlSections] = useState<number[] | number | null>([]);
  const [previewSections, setPreviewSections] = useState<number[] | number | null>([]);

  useEffect(() => {
    sdk.safe
      .devDiagnostics()
      .then((result) => {
        if (result.ok) {
          setSecurityError(null);
          const diagnostics = result.data.devDiagnostics;
          if (!diagnostics) {
            return;
          }
          setSecurityInfo({
            roles: diagnostics.roles ?? [],
            permissions: diagnostics.permissions ?? [],
            seedStatus: {
              adminRoleExists: diagnostics.seedStatus?.adminRoleExists ?? false,
              adminPermissionCoverage: diagnostics.seedStatus?.adminPermissionCoverage ?? false,
              adminUserHasRole: diagnostics.seedStatus?.adminUserHasRole ?? false
            }
          });
          return;
        }
        setSecurityError(result.error.message);
      })
      .catch(() => setSecurityError('Unable to load security diagnostics.'));
  }, [sdk]);

  useEffect(() => {
    setMaxEntriesDraft(collectorState.maxEntries);
  }, [collectorState.maxEntries]);

  const filteredIssues = useMemo(() => {
    const routeQuery = routeFilter.trim().toLowerCase();
    return collectorState.entries.filter((entry) => {
      if (levelFilter !== 'all' && entry.level !== levelFilter) {
        return false;
      }
      if (sourceFilter !== 'all' && entry.source !== sourceFilter) {
        return false;
      }
      if (routeQuery.length > 0 && !entry.route.toLowerCase().includes(routeQuery)) {
        return false;
      }
      return true;
    });
  }, [collectorState.entries, levelFilter, sourceFilter, routeFilter]);

  useEffect(() => {
    if (filteredIssues.length === 0) {
      setSelectedIssue(null);
      return;
    }
    if (!selectedIssue) {
      setSelectedIssue(filteredIssues[0] ?? null);
      return;
    }
    if (!filteredIssues.some((entry) => entry.id === selectedIssue.id)) {
      setSelectedIssue(filteredIssues[0] ?? null);
    }
  }, [filteredIssues, selectedIssue]);

  const tokens = [
    '--surface-ground',
    '--surface-card',
    '--surface-overlay',
    '--surface-border',
    '--text-color',
    '--text-color-secondary',
    '--primary-color'
  ];

  const exportMarkdown = () => {
    const markdown = issueCollector.exportMarkdown(filteredIssues);
    setExportBuffer(markdown);
    downloadText('contenthead-issues.md', markdown, 'text/markdown;charset=utf-8');
  };

  const exportJson = () => {
    const json = issueCollector.exportJson(filteredIssues);
    setExportBuffer(json);
    downloadText('contenthead-issues.json', json, 'application/json;charset=utf-8');
  };

  const copyExport = async () => {
    const text = exportBuffer || issueCollector.exportMarkdown(filteredIssues);
    try {
      await navigator.clipboard.writeText(text);
      toast({ severity: 'success', summary: 'Diagnostics copied to clipboard' }, 'dev/diagnostics');
    } catch {
      toast(
        {
          severity: 'warn',
          summary: 'Clipboard unavailable',
          detail: 'Copy failed. Use Export buttons instead.'
        },
        'dev/diagnostics'
      );
    }
  };

  return (
    <WorkspacePage>
      <WorkspaceHeader title="Diagnostics" subtitle="Build, GraphQL, runtime and issue diagnostics." />
      <WorkspaceBody>
        <div className="pane paneScroll form-row diagnostics-page-shell">
          <TabView activeIndex={activeTab} onTabChange={(event) => setActiveTab(event.index)}>
            <TabPanel header="Issues">
              <Card>
                <div className="diagnostics-issues-toolbar">
                  <div className="diagnostics-issues-filters">
                    <Select
                      value={levelFilter}
                      options={LEVEL_OPTIONS}
                      onChange={(next) => next !== undefined && setLevelFilter(next as 'all' | IssueLevel)}
                    />
                    <Select
                      value={sourceFilter}
                      options={SOURCE_OPTIONS}
                      onChange={(next) => next !== undefined && setSourceFilter(next as 'all' | IssueSource)}
                    />
                    <TextInput
                      value={routeFilter}
                      onChange={(next) => setRouteFilter(next)}
                      placeholder="Filter route"
                    />
                  </div>
                  <div className="diagnostics-issues-actions">
                    <label className="diagnostics-toggle">
                      <span>Paused</span>
                      <Switch
                        checked={collectorState.paused}
                        onChange={(next) => issueCollector.setPaused(next)}
                      />
                    </label>
                    <label className="diagnostics-max">
                      <span>Max entries</span>
                      <NumberInput
                        value={maxEntriesDraft}
                        min={10}
                        max={1000}
                        showButtons
                        onChange={(next) => {
                          const value = next ?? collectorState.maxEntries;
                          setMaxEntriesDraft(value);
                          issueCollector.setMaxEntries(value);
                        }}
                      />
                    </label>
                    <Button label="Export as Markdown" onClick={exportMarkdown} />
                    <Button label="Export as JSON" severity="secondary" onClick={exportJson} />
                    <Button label="Copy to clipboard" severity="secondary" onClick={() => void copyExport()} />
                    <Button
                      label="Clear"
                      severity="danger"
                      onClick={() => {
                        issueCollector.clear();
                        setSelectedIssue(null);
                      }}
                    />
                  </div>
                </div>
                <DataTable
                  value={filteredIssues}
                  dataKey="id"
                  size="small"
                  selectionMode="single"
                  selection={selectedIssue}
                  onSelectionChange={(event) => setSelectedIssue((event.value as IssueEntry) ?? null)}
                  scrollable
                  scrollHeight="320px"
                >
                  <Column
                    field="ts"
                    header="ts"
                    body={(entry: IssueEntry) => new Date(entry.ts).toLocaleString()}
                  />
                  <Column field="level" header="level" />
                  <Column field="source" header="source" />
                  <Column field="route" header="route" />
                  <Column field="title" header="title" />
                  <Column field="count" header="count" />
                </DataTable>
              </Card>

              <Card title="Issue details">
                {!selectedIssue ? (
                  <div className="status-panel">No issue selected.</div>
                ) : (
                  <div className="diagnostics-issue-detail">
                    <div className="diagnostics-grid">
                      <div className="status-panel">
                        <strong>Title</strong>
                        <div>{selectedIssue.title}</div>
                      </div>
                      <div className="status-panel">
                        <strong>Route</strong>
                        <div>{selectedIssue.route}</div>
                      </div>
                      <div className="status-panel">
                        <strong>User</strong>
                        <div>{selectedIssue.userSummary ?? 'anonymous'}</div>
                      </div>
                      <div className="status-panel">
                        <strong>Feature</strong>
                        <div>{selectedIssue.featureTag ?? 'n/a'}</div>
                      </div>
                      <div className="status-panel">
                        <strong>Site</strong>
                        <div>{selectedIssue.context.siteId ?? 'n/a'}</div>
                      </div>
                      <div className="status-panel">
                        <strong>Market / Locale</strong>
                        <div>
                          {(selectedIssue.context.market ?? 'n/a')} / {(selectedIssue.context.locale ?? 'n/a')}
                        </div>
                      </div>
                      <div className="status-panel">
                        <strong>Build</strong>
                        <div>{selectedIssue.buildInfo ?? 'n/a'}</div>
                      </div>
                    </div>

                    <div className="status-panel">
                      <strong>Details</strong>
                      <pre>{selectedIssue.details}</pre>
                    </div>

                    {selectedIssue.stack ? (
                      <div className="status-panel">
                        <strong>Stack</strong>
                        <pre>{selectedIssue.stack}</pre>
                      </div>
                    ) : null}

                    {selectedIssue.graphql ? (
                      <div className="status-panel">
                        <strong>GraphQL</strong>
                        <pre>{JSON.stringify(selectedIssue.graphql, null, 2)}</pre>
                      </div>
                    ) : null}
                  </div>
                )}
              </Card>
            </TabPanel>

            <TabPanel header="Overview">
              <Card>
                <div className="diagnostics-grid">
                  <div className="status-panel">
                    <strong>Site</strong>
                    <div>#{siteId}</div>
                  </div>
                  <div className="status-panel">
                    <strong>Market</strong>
                    <div>{marketCode}</div>
                  </div>
                  <div className="status-panel">
                    <strong>Locale</strong>
                    <div>{localeCode}</div>
                  </div>
                  <div className="status-panel">
                    <strong>Theme</strong>
                    <div>{theme}</div>
                  </div>
                  <div className="status-panel">
                    <strong>Theme Mode</strong>
                    <div>{themeMode}</div>
                  </div>
                  <div className="status-panel">
                    <strong>Monaco Theme</strong>
                    <div>{themeBridge.monacoTheme}</div>
                  </div>
                  <div className="status-panel">
                    <strong>Scale</strong>
                    <div>{scale}px</div>
                  </div>
                  <div className="status-panel">
                    <strong>API</strong>
                    <div>{import.meta.env.VITE_API_URL ?? 'http://localhost:4000/graphql'}</div>
                  </div>
                  <div className="status-panel">
                    <strong>Mode</strong>
                    <div>{import.meta.env.MODE}</div>
                  </div>
                  <div className="status-panel">
                    <strong>Build</strong>
                    <div>{import.meta.env.VITE_BUILD_SHA ?? 'local-dev'}</div>
                  </div>
                  <div className="status-panel">
                    <strong>Context Error</strong>
                    <div>{error ?? 'none'}</div>
                  </div>
                </div>
              </Card>

              <Accordion
                multiple
                activeIndex={overviewSections}
                onTabChange={(event) => setOverviewSections(event.index)}
                className="diagnostics-overview-accordion"
              >
                <AccordionTab header="GraphQL Errors (Last 20)">
                  {graphqlErrors.length === 0 ? (
                    <div className="status-panel">No GraphQL errors captured.</div>
                  ) : (
                    <Accordion
                      multiple
                      activeIndex={graphqlSections}
                      onTabChange={(event) => setGraphqlSections(event.index)}
                      className="diagnostics-events-accordion"
                    >
                      {graphqlErrors.map((entry) => (
                        <AccordionTab
                          key={`${entry.timestamp}-${entry.operationName}`}
                          header={`${entry.operationName} • ${new Date(entry.timestamp).toLocaleString()}`}
                        >
                          <div className="status-panel diagnostics-error-item">
                            <div>{entry.message}</div>
                            <pre>{JSON.stringify(entry.variables, null, 2)}</pre>
                          </div>
                        </AccordionTab>
                      ))}
                    </Accordion>
                  )}
                </AccordionTab>

                <AccordionTab header="Preview Bridge (Last 20)">
                  {previewDiagnostics.length === 0 ? (
                    <div className="status-panel">No preview bridge events captured.</div>
                  ) : (
                    <Accordion
                      multiple
                      activeIndex={previewSections}
                      onTabChange={(event) => setPreviewSections(event.index)}
                      className="diagnostics-events-accordion"
                    >
                      {previewDiagnostics.map((entry) => (
                        <AccordionTab
                          key={`${entry.timestamp}-${entry.direction}-${entry.event}`}
                          header={`${entry.event} • ${entry.direction}${typeof entry.ok === 'boolean' ? ` • ${entry.ok ? 'ok' : 'error'}` : ''} • ${new Date(entry.timestamp).toLocaleString()}`}
                        >
                          <div className="status-panel diagnostics-error-item">
                            <pre>{JSON.stringify(entry.payload, null, 2)}</pre>
                          </div>
                        </AccordionTab>
                      ))}
                    </Accordion>
                  )}
                </AccordionTab>

                <AccordionTab header="Security / RBAC Diagnostics">
                  {securityError ? (
                    <ForbiddenState title="Security diagnostics unavailable" reason={securityError} />
                  ) : !securityInfo ? (
                    <div className="status-panel">Loading security diagnostics...</div>
                  ) : (
                    <div className="diagnostics-grid">
                      <div className="status-panel">
                        <strong>Roles</strong>
                        <div>{securityInfo.roles.join(', ') || 'none'}</div>
                      </div>
                      <div className="status-panel">
                        <strong>Permissions</strong>
                        <div>{securityInfo.permissions.length}</div>
                      </div>
                      <div className="status-panel">
                        <strong>Admin role exists</strong>
                        <div>{securityInfo.seedStatus.adminRoleExists ? 'yes' : 'no'}</div>
                      </div>
                      <div className="status-panel">
                        <strong>Admin has full permissions</strong>
                        <div>{securityInfo.seedStatus.adminPermissionCoverage ? 'yes' : 'no'}</div>
                      </div>
                      <div className="status-panel">
                        <strong>Admin user linked to admin role</strong>
                        <div>{securityInfo.seedStatus.adminUserHasRole ? 'yes' : 'no'}</div>
                      </div>
                    </div>
                  )}
                </AccordionTab>

                <AccordionTab header="Theme Diagnostics">
                  <div className="diagnostics-grid">
                    {tokens.map((tokenName) => (
                      <div key={tokenName} className="status-panel">
                        <strong>{tokenName}</strong>
                        <div>{readCssVar(tokenName) || '(not set)'}</div>
                      </div>
                    ))}
                  </div>
                </AccordionTab>
              </Accordion>
            </TabPanel>
          </TabView>
        </div>
      </WorkspaceBody>
    </WorkspacePage>
  );
}

function downloadText(filename: string, content: string, contentType: string): void {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
