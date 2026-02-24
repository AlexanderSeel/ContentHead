import { useEffect, useMemo, useState } from 'react';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import { Tag } from 'primereact/tag';

import { useAuth } from '../../app/AuthContext';
import { createAdminSdk } from '../../lib/sdk';
import { CommandMenuButton } from '../../ui/commands/CommandMenuButton';
import type { Command, CommandContext } from '../../ui/commands/types';
import { WorkspaceActionBar, WorkspaceBody, WorkspaceHeader, WorkspacePage } from '../../ui/molecules';

type ConnectorDomain = 'auth' | 'db' | 'dam' | 'ai';

type ConnectorRow = {
  id: number;
  domain: ConnectorDomain;
  type: string;
  name: string;
  enabled: boolean;
  isDefault: boolean;
  configJson: string;
};

const providerOptions: Record<ConnectorDomain, Array<{ label: string; value: string; help: string }>> = {
  auth: [
    { label: 'internal', value: 'internal', help: 'Built-in auth/users/roles.' },
    { label: 'oidc', value: 'oidc', help: 'External OIDC provider configuration.' }
  ],
  db: [
    { label: 'duckdb', value: 'duckdb', help: 'Current runtime provider.' },
    { label: 'postgres', value: 'postgres', help: 'Future runtime support; config only.' },
    { label: 'mysql', value: 'mysql', help: 'Future runtime support; config only.' }
  ],
  dam: [
    { label: 'localfs', value: 'localfs', help: 'Local filesystem provider.' },
    { label: 's3', value: 's3', help: 'S3-compatible provider stub.' }
  ],
  ai: [
    { label: 'mock', value: 'mock', help: 'Offline mock provider.' },
    { label: 'openai_compatible', value: 'openai_compatible', help: 'OpenAI-compatible API.' },
    { label: 'ollama', value: 'ollama', help: 'Local Ollama endpoint.' }
  ]
};

const configHints: Record<string, string> = {
  internal: '{\n  "enabled": true\n}',
  oidc: '{\n  "issuerUrl": "https://issuer.example",\n  "clientId": "...",\n  "clientSecret": "...",\n  "scopes": "openid profile email",\n  "redirectUri": "http://localhost:5173/login"\n}',
  duckdb: '{\n  "path": "./data/contenthead.duckdb"\n}',
  postgres: '{\n  "host": "localhost",\n  "port": 5432,\n  "database": "contenthead",\n  "user": "postgres",\n  "password": "..."\n}',
  mysql: '{\n  "host": "localhost",\n  "port": 3306,\n  "database": "contenthead",\n  "user": "root",\n  "password": "..."\n}',
  localfs: '{\n  "basePath": "./.data/assets"\n}',
  s3: '{\n  "bucket": "...",\n  "region": "...",\n  "accessKey": "...",\n  "secretKey": "..."\n}',
  mock: '{\n  "enabled": true\n}',
  openai_compatible: '{\n  "baseUrl": "https://api.openai.com/v1",\n  "apiKey": "...",\n  "model": "gpt-4o-mini"\n}',
  ollama: '{\n  "baseUrl": "http://localhost:11434",\n  "model": "llama3.1"\n}'
};

function toTitle(domain: ConnectorDomain): string {
  if (domain === 'auth') return 'Auth Connectors';
  if (domain === 'db') return 'DB Connectors';
  if (domain === 'dam') return 'DAM Connectors';
  return 'AI Connectors';
}

type ConnectorCommandContext = CommandContext & {
  selected: ConnectorRow | null;
  refresh: () => Promise<void>;
  runSave: () => Promise<void>;
  runSetDefault: () => Promise<void>;
  runTest: () => Promise<void>;
  runDelete: () => Promise<void>;
};

export function ConnectorSettingsPage({ domain }: { domain: ConnectorDomain }) {
  const { token } = useAuth();
  const sdk = useMemo(() => createAdminSdk(token), [token]);

  const [rows, setRows] = useState<ConnectorRow[]>([]);
  const [selected, setSelected] = useState<ConnectorRow | null>(null);
  const [selectedBaseline, setSelectedBaseline] = useState<ConnectorRow | null>(null);
  const [status, setStatus] = useState('');
  const [testResult, setTestResult] = useState('');

  const refresh = async () => {
    const response = await sdk.listConnectors({ domain });
    const values = (response.listConnectors ?? []) as ConnectorRow[];
    setRows(values);
    const nextSelected = values.find((entry) => entry.id === selected?.id) ?? values[0] ?? null;
    setSelected(nextSelected);
    setSelectedBaseline(nextSelected ? { ...nextSelected } : null);
  };

  useEffect(() => {
    refresh().catch((error: unknown) => setStatus(String(error)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domain]);

  const selectedProvider = providerOptions[domain].find((entry) => entry.value === selected?.type);
  const parsedConfigValid = useMemo(() => {
    if (!selected) {
      return true;
    }
    try {
      JSON.parse(selected.configJson || '{}');
      return true;
    } catch {
      return false;
    }
  }, [selected]);
  const isValid = Boolean(selected?.name?.trim() && selected?.type) && parsedConfigValid;
  const isDirty = useMemo(() => {
    if (!selected && !selectedBaseline) {
      return false;
    }
    return JSON.stringify(selected) !== JSON.stringify(selectedBaseline);
  }, [selected, selectedBaseline]);

  const saveSelected = async () => {
    if (!selected) {
      return;
    }
    await sdk.upsertConnector({
      id: selected.id || null,
      domain,
      type: selected.type,
      name: selected.name,
      enabled: selected.enabled,
      isDefault: selected.isDefault,
      configJson: selected.configJson || '{}'
    });
    await refresh();
  };

  const overflowContext: ConnectorCommandContext = {
    route: '/settings',
    selectedContentItemId: null,
    selected,
    refresh,
    runSave: saveSelected,
    runSetDefault: async () => {
      if (!selected?.id) {
        return;
      }
      await sdk.setDefaultConnector({ domain, id: selected.id });
      await refresh();
    },
    runTest: async () => {
      if (!selected?.id) {
        return;
      }
      const res = await sdk.testConnector({ id: selected.id });
      setTestResult(res.testConnector ?? 'No result');
    },
    runDelete: async () => {
      if (!selected?.id) {
        return;
      }
      await sdk.deleteConnector({ id: selected.id });
      await refresh();
    }
  };

  const overflowCommands: Command<ConnectorCommandContext>[] = [
    {
      id: 'connector.refresh',
      label: 'Refresh',
      icon: 'pi pi-refresh',
      group: 'View',
      run: (ctx) => ctx.refresh()
    },
    {
      id: 'connector.set-default',
      label: 'Set default',
      icon: 'pi pi-star',
      group: 'Advanced',
      enabled: (ctx) => Boolean(ctx.selected?.id),
      run: (ctx) => ctx.runSetDefault()
    },
    {
      id: 'connector.test',
      label: 'Test',
      icon: 'pi pi-check-circle',
      group: 'Advanced',
      enabled: (ctx) => Boolean(ctx.selected?.id),
      run: (ctx) => ctx.runTest()
    },
    {
      id: 'connector.delete',
      label: 'Delete',
      icon: 'pi pi-trash',
      group: 'Danger',
      danger: true,
      requiresConfirm: true,
      confirmText: 'Delete this connector?',
      enabled: (ctx) => Boolean(ctx.selected?.id),
      run: (ctx) => ctx.runDelete()
    }
  ];

  return (
    <WorkspacePage>
      <WorkspaceHeader
        title={toTitle(domain)}
        subtitle="Provider selection, defaults, advanced config, and validation."
        helpTopicKey="site_overview"
        badges={isDirty ? <Tag value="Unsaved changes" severity="warning" /> : null}
      />
      <WorkspaceActionBar
        primary={(
          <>
            <Button
              label="New Connector"
              onClick={() =>
                setSelected({
                  id: 0,
                  domain,
                  type: providerOptions[domain][0]?.value ?? 'internal',
                  name: `${domain} connector`,
                  enabled: true,
                  isDefault: rows.length === 0,
                  configJson: configHints[providerOptions[domain][0]?.value ?? 'internal'] ?? '{}'
                })
              }
            />
            <Button label="Save" onClick={() => saveSelected().catch((error: unknown) => setStatus(String(error)))} disabled={!isDirty || !isValid} />
          </>
        )}
        overflow={<CommandMenuButton commands={overflowCommands} context={overflowContext} buttonLabel="" buttonIcon="pi pi-ellipsis-h" text />}
      />
      <WorkspaceBody>
        <Splitter className="splitFill" style={{ width: '100%' }}>
          <SplitterPanel size={40} minSize={28}>
            <div className="paneRoot">
              <div className="paneScroll">
                <DataTable
                  value={rows}
                  size="small"
                  selectionMode="single"
                  selection={selected}
                  onSelectionChange={(event) => {
                    const next = (event.value as ConnectorRow) ?? null;
                    setSelected(next);
                    setSelectedBaseline(next ? { ...next } : null);
                  }}
                >
                  <Column field="name" header="Name" />
                  <Column field="type" header="Type" />
                  <Column field="enabled" header="Enabled" body={(row: ConnectorRow) => (row.enabled ? 'Yes' : 'No')} />
                  <Column field="isDefault" header="Default" body={(row: ConnectorRow) => (row.isDefault ? 'Yes' : 'No')} />
                </DataTable>
              </div>
            </div>
          </SplitterPanel>
          <SplitterPanel size={60} minSize={32}>
            <div className="paneRoot">
              <div className="paneScroll">
                {!selected ? (
                  <p className="muted">Select or create a connector.</p>
                ) : (
                  <Accordion multiple activeIndex={[0]}>
                    <AccordionTab header="Basic">
                      <div className="form-row">
                        <label>Name</label>
                        <InputText value={selected.name} onChange={(event) => setSelected({ ...selected, name: event.target.value })} />
                      </div>
                      <div className="form-row">
                        <label>Type</label>
                        <Dropdown
                          value={selected.type}
                          options={providerOptions[domain]}
                          optionLabel="label"
                          optionValue="value"
                          onChange={(event) =>
                            setSelected({
                              ...selected,
                              type: String(event.value),
                              configJson: configHints[String(event.value)] ?? selected.configJson
                            })
                          }
                        />
                        {selectedProvider ? <small>{selectedProvider.help}</small> : null}
                      </div>
                      <label>
                        <Checkbox checked={selected.enabled} onChange={(event) => setSelected({ ...selected, enabled: Boolean(event.checked) })} /> Enabled
                      </label>
                      <label>
                        <Checkbox checked={selected.isDefault} onChange={(event) => setSelected({ ...selected, isDefault: Boolean(event.checked) })} /> Default for {domain}
                      </label>
                      {domain === 'db' ? <div className="status-panel">Core runtime still uses DuckDB. Other DB providers are stored for future activation.</div> : null}
                    </AccordionTab>
                    <AccordionTab header="Advanced">
                      <div className="form-row">
                        <label>Config JSON</label>
                        <InputTextarea rows={12} value={selected.configJson} onChange={(event) => setSelected({ ...selected, configJson: event.target.value })} />
                        {!parsedConfigValid ? <small className="error-text">Config JSON must be valid JSON.</small> : null}
                      </div>
                    </AccordionTab>
                    <AccordionTab header="Security / Secrets">
                      <div className="form-row">
                        <small>Secret fields are stored in connector config and should be managed carefully. UI masks values after reload.</small>
                      </div>
                    </AccordionTab>
                  </Accordion>
                )}
                {testResult ? <div className="status-panel">{testResult}</div> : null}
              </div>
            </div>
          </SplitterPanel>
        </Splitter>
      </WorkspaceBody>
      {status ? <div className="status-panel"><pre>{status}</pre></div> : null}
    </WorkspacePage>
  );
}
