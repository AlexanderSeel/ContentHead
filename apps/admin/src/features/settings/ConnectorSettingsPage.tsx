import { useEffect, useMemo, useState } from 'react';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';

import { useAuth } from '../../app/AuthContext';
import { PageHeader } from '../../components/common/PageHeader';
import { createAdminSdk } from '../../lib/sdk';

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

export function ConnectorSettingsPage({ domain }: { domain: ConnectorDomain }) {
  const { token } = useAuth();
  const sdk = useMemo(() => createAdminSdk(token), [token]);

  const [rows, setRows] = useState<ConnectorRow[]>([]);
  const [selected, setSelected] = useState<ConnectorRow | null>(null);
  const [status, setStatus] = useState('');
  const [testResult, setTestResult] = useState('');

  const refresh = async () => {
    const response = await sdk.listConnectors({ domain });
    const values = (response.listConnectors ?? []) as ConnectorRow[];
    setRows(values);
    setSelected((prev) => values.find((entry) => entry.id === prev?.id) ?? values[0] ?? null);
  };

  useEffect(() => {
    refresh().catch((error: unknown) => setStatus(String(error)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domain]);

  const selectedProvider = providerOptions[domain].find((entry) => entry.value === selected?.type);

  return (
    <div className="pageRoot">
      <PageHeader title={toTitle(domain)} subtitle="Provider selection, defaults, advanced config, and validation" helpTopicKey="site_overview" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1rem' }}>
        <section className="content-card">
          <div className="inline-actions" style={{ marginBottom: '0.5rem' }}>
            <Button
              label="New"
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
          </div>
          <DataTable value={rows} size="small" selectionMode="single" selection={selected} onSelectionChange={(event) => setSelected((event.value as ConnectorRow) ?? null)}>
            <Column field="name" header="Name" />
            <Column field="type" header="Type" />
            <Column field="enabled" header="Enabled" body={(row: ConnectorRow) => (row.enabled ? 'Yes' : 'No')} />
            <Column field="isDefault" header="Default" body={(row: ConnectorRow) => (row.isDefault ? 'Yes' : 'No')} />
          </DataTable>
        </section>

        <section className="content-card">
          {!selected ? (
            <p className="muted">Select or create a connector.</p>
          ) : (
            <Accordion multiple activeIndex={[0, 1]}>
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
                </div>
              </AccordionTab>

              <AccordionTab header="Secrets">
                <div className="form-row">
                  <small>Secret fields are stored in connector config and should be managed carefully. UI masks values after reload.</small>
                </div>
              </AccordionTab>
            </Accordion>
          )}
          {selected ? (
            <div className="inline-actions" style={{ marginTop: '0.75rem' }}>
              <Button
                label="Save"
                onClick={() =>
                  sdk
                    .upsertConnector({
                      id: selected.id || null,
                      domain,
                      type: selected.type,
                      name: selected.name,
                      enabled: selected.enabled,
                      isDefault: selected.isDefault,
                      configJson: selected.configJson || '{}'
                    })
                    .then(() => refresh())
                    .catch((error: unknown) => setStatus(String(error)))
                }
              />
              <Button
                label="Set Default"
                severity="secondary"
                onClick={() =>
                  sdk
                    .setDefaultConnector({ domain, id: selected.id })
                    .then(() => refresh())
                    .catch((error: unknown) => setStatus(String(error)))
                }
                disabled={!selected.id}
              />
              <Button
                label="Test"
                severity="info"
                onClick={() =>
                  sdk
                    .testConnector({ id: selected.id })
                    .then((res) => setTestResult(res.testConnector ?? 'No result'))
                    .catch((error: unknown) => setStatus(String(error)))
                }
                disabled={!selected.id}
              />
              <Button
                label="Delete"
                severity="danger"
                onClick={() =>
                  sdk
                    .deleteConnector({ id: selected.id })
                    .then(() => refresh())
                    .catch((error: unknown) => setStatus(String(error)))
                }
                disabled={!selected.id}
              />
            </div>
          ) : null}
          {testResult ? <div className="status-panel">{testResult}</div> : null}
        </section>
      </div>
      {status ? <div className="status-panel"><pre>{status}</pre></div> : null}
    </div>
  );
}
