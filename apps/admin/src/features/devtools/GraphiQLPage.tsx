import { useEffect, useMemo, useState } from 'react';
import { GraphiQL } from 'graphiql';
import type { Fetcher } from '@graphiql/toolkit';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { SplitButton } from 'primereact/splitbutton';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Tree } from 'primereact/tree';
import type { MenuItem } from 'primereact/menuitem';
import type { TreeNode } from 'primereact/treenode';

import { PageHeader } from '../../components/common/PageHeader';
import { useAuth } from '../../app/AuthContext';

import 'graphiql/style.css';

const samples: Array<{ label: string; query: string; variables?: string }> = [
  { label: 'me', query: `query Me { me { id username displayName } }` },
  { label: 'listSites', query: `query ListSites { listSites { id name active urlPattern } }` },
  {
    label: 'getSiteMarketLocaleMatrix',
    query: `query Matrix($siteId: Int!) { getSiteMarketLocaleMatrix(siteId: $siteId) { siteId combinations { marketCode localeCode active } } }`,
    variables: `{"siteId":1}`
  },
  {
    label: 'resolveRoute',
    query: `query ResolveRoute($siteId:Int!,$marketCode:String!,$localeCode:String!,$slug:String!){ resolveRoute(siteId:$siteId,marketCode:$marketCode,localeCode:$localeCode,slug:$slug){ mode version { id versionNumber state } } }`,
    variables: `{"siteId":1,"marketCode":"US","localeCode":"en-US","slug":"start"}`
  },
  {
    label: 'getPageByRoute',
    query: `query PageByRoute($siteId:Int!,$marketCode:String!,$localeCode:String!,$slug:String!,$contextJson:String){ getPageByRoute(siteId:$siteId,marketCode:$marketCode,localeCode:$localeCode,slug:$slug,contextJson:$contextJson){ selectionReason selectedVariant { key } selectedVersion { id state } } }`,
    variables: `{"siteId":1,"marketCode":"US","localeCode":"en-US","slug":"start","contextJson":"{}"}`
  },
  { label: 'listVersions', query: `query Versions($contentItemId:Int!){ listVersions(contentItemId:$contentItemId){ id versionNumber state } }`, variables: `{"contentItemId":1}` },
  { label: 'workflows list', query: `query Workflows { listWorkflowDefinitions { id name version } }` },
  {
    label: 'startRun',
    query: `mutation StartRun($definitionId:Int!,$contextJson:String!){ startWorkflowRun(definitionId:$definitionId,contextJson:$contextJson){ id status currentNodeId } }`,
    variables: `{"definitionId":1,"contextJson":"{}"}`
  }
];

const INTROSPECTION_QUERY = `
  query IntrospectionQuery {
    __schema {
      queryType { name }
      mutationType { name }
      types {
        kind
        name
        fields {
          name
          args {
            name
            type { kind name ofType { kind name ofType { kind name } } }
          }
          type { kind name ofType { kind name ofType { kind name } } }
        }
      }
    }
  }
`;

type IntrospectionTypeRef = {
  kind: string;
  name?: string | null;
  ofType?: IntrospectionTypeRef | null;
};

type IntrospectionField = {
  name: string;
  args?: Array<{ name: string; type: IntrospectionTypeRef }> | null;
  type: IntrospectionTypeRef;
};

type IntrospectionType = {
  kind: string;
  name: string;
  fields?: IntrospectionField[] | null;
};

type IntrospectionSchemaPayload = {
  __schema: {
    queryType?: { name: string } | null;
    mutationType?: { name: string } | null;
    types: IntrospectionType[];
  };
};

function formatType(type: IntrospectionTypeRef | null | undefined): string {
  if (!type) {
    return 'Unknown';
  }
  if (type.kind === 'NON_NULL') {
    return `${formatType(type.ofType)}!`;
  }
  if (type.kind === 'LIST') {
    return `[${formatType(type.ofType)}]`;
  }
  return type.name ?? type.kind;
}

export function GraphiQLPage() {
  const { token } = useAuth();
  const endpoint = `${import.meta.env.VITE_API_URL ?? 'http://localhost:4000/graphql'}`;
  const [previewToken, setPreviewToken] = useState('');
  const [useSessionToken, setUseSessionToken] = useState(true);
  const [query, setQuery] = useState(samples[0]!.query);
  const [variables, setVariables] = useState(samples[0]!.variables ?? '{}');
  const [headersEditor, setHeadersEditor] = useState('{}');
  const [headersError, setHeadersError] = useState('');
  const [headersDialogOpen, setHeadersDialogOpen] = useState(false);
  const [editorSeed, setEditorSeed] = useState(0);
  const [selectedSampleLabel, setSelectedSampleLabel] = useState(samples[0]!.label);
  const [activeQuery, setActiveQuery] = useState(samples[0]!.query);
  const [lastResponse, setLastResponse] = useState('');
  const [schemaNodes, setSchemaNodes] = useState<TreeNode[]>([]);
  const [schemaError, setSchemaError] = useState('');
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [explorerSelectionKeys, setExplorerSelectionKeys] = useState<string | null>(null);

  const buildPayload = () => {
    let parsedVariables: unknown = {};
    try {
      parsedVariables = JSON.parse(variables || '{}');
    } catch {
      parsedVariables = {};
    }
    return { query: activeQuery || query, variables: parsedVariables };
  };

  useEffect(() => {
    const nextHeaders = {
      ...(useSessionToken && token ? { authorization: `Bearer ${token}` } : {}),
      ...(previewToken ? { 'x-preview-token': previewToken } : {})
    };
    setHeadersEditor(JSON.stringify(nextHeaders, null, 2));
  }, [previewToken, token, useSessionToken]);

  const parsedHeaders = useMemo(() => {
    try {
      const parsed = JSON.parse(headersEditor) as Record<string, string>;
      setHeadersError('');
      return parsed;
    } catch (error) {
      setHeadersError(error instanceof Error ? error.message : 'Invalid JSON');
      return {};
    }
  }, [headersEditor]);

  const fetcher = useMemo<Fetcher>(
    () => async (graphQLParams) => {
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'content-type': 'application/json',
          ...parsedHeaders
        },
        body: JSON.stringify(graphQLParams)
      });
      const json = await response.json();
      const queryText = typeof graphQLParams === 'string'
        ? graphQLParams
        : typeof graphQLParams === 'object' && graphQLParams !== null && 'query' in graphQLParams
          ? String((graphQLParams as { query?: unknown }).query ?? '')
          : '';
      const isIntrospection = queryText.includes('__schema') || queryText.includes('__type') || queryText.includes('IntrospectionQuery');
      if (!isIntrospection) {
        setLastResponse(JSON.stringify(json, null, 2));
      }
      return json;
    },
    [endpoint, parsedHeaders]
  );

  const applySample = (sample: { label: string; query: string; variables?: string }) => {
    setSelectedSampleLabel(sample.label);
    setQuery(sample.query);
    setActiveQuery(sample.query);
    setVariables(sample.variables ?? '{}');
    setEditorSeed((prev) => prev + 1);
  };

  const sampleMenuItems = useMemo<MenuItem[]>(
    () =>
      samples.map((sample) => ({
        label: sample.label,
        command: () => applySample(sample)
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const insertOperationFromExplorer = (nodeData: { fieldName?: string; operation?: 'query' | 'mutation'; args?: Array<{ name: string; type: string }> }) => {
    if (!nodeData.fieldName || !nodeData.operation) {
      return;
    }
    const args = nodeData.args ?? [];
    const variableDefs = args.length > 0 ? `(${args.map((arg) => `$${arg.name}: ${arg.type}`).join(', ')})` : '';
    const fieldArgs = args.length > 0 ? `(${args.map((arg) => `${arg.name}: $${arg.name}`).join(', ')})` : '';
    const opName = `${nodeData.fieldName}Sample`;
    const text = `${nodeData.operation} ${opName}${variableDefs} {\n  ${nodeData.fieldName}${fieldArgs}\n}`;
    setQuery(text);
    setActiveQuery(text);
    if (args.length > 0) {
      const nextVars = args.reduce<Record<string, string | number | boolean | null>>((acc, arg) => {
        if (arg.type.includes('Int') || arg.type.includes('Float')) {
          acc[arg.name] = 0;
        } else if (arg.type.includes('Boolean')) {
          acc[arg.name] = false;
        } else {
          acc[arg.name] = '';
        }
        return acc;
      }, {});
      setVariables(JSON.stringify(nextVars, null, 2));
    }
    setEditorSeed((prev) => prev + 1);
  };

  const loadSchemaExplorer = async () => {
    setSchemaLoading(true);
    setSchemaError('');
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'content-type': 'application/json',
          ...parsedHeaders
        },
        body: JSON.stringify({ query: INTROSPECTION_QUERY })
      });
      const json = await response.json() as { data?: IntrospectionSchemaPayload; errors?: Array<{ message?: string }> };
      if (!json.data) {
        setSchemaError(json.errors?.[0]?.message ?? 'Introspection failed.');
        setSchemaNodes([]);
        return;
      }
      const { __schema } = json.data;
      const typesByName = new Map(__schema.types.map((type) => [type.name, type]));
      const queryType = __schema.queryType?.name ? typesByName.get(__schema.queryType.name) : undefined;
      const mutationType = __schema.mutationType?.name ? typesByName.get(__schema.mutationType.name) : undefined;
      const nextNodes: TreeNode[] = [];
      if (queryType?.fields) {
        nextNodes.push({
          key: 'query-root',
          label: 'Query',
          selectable: false,
          children: queryType.fields.map((field) => ({
            key: `q-${field.name}`,
            label: `${field.name}: ${formatType(field.type)}`,
            data: {
              fieldName: field.name,
              operation: 'query',
              args: (field.args ?? []).map((arg) => ({
                name: arg.name,
                type: formatType(arg.type)
              }))
            }
          }))
        });
      }
      if (mutationType?.fields) {
        nextNodes.push({
          key: 'mutation-root',
          label: 'Mutation',
          selectable: false,
          children: mutationType.fields.map((field) => ({
            key: `m-${field.name}`,
            label: `${field.name}: ${formatType(field.type)}`,
            data: {
              fieldName: field.name,
              operation: 'mutation',
              args: (field.args ?? []).map((arg) => ({
                name: arg.name,
                type: formatType(arg.type)
              }))
            }
          }))
        });
      }
      setSchemaNodes(nextNodes);
    } catch (error) {
      setSchemaError(error instanceof Error ? error.message : 'Failed to load schema.');
      setSchemaNodes([]);
    } finally {
      setSchemaLoading(false);
    }
  };

  useEffect(() => {
    void loadSchemaExplorer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, parsedHeaders]);

  return (
    <div className="pageRoot">
      <PageHeader
        title="GraphiQL Dev Tool"
        subtitle="SWAPI-like GraphQL playground with samples, docs, explorer, variables and headers."
        helpTopicKey="graphiql"
        askAiContext="graphql"
        askAiPayload={{ endpoint, query: activeQuery, variables, headers: headersEditor }}
        onAskAiInsert={(value) => {
          setQuery(value);
          setActiveQuery(value);
          setEditorSeed((prev) => prev + 1);
        }}
        actions={(
          <div className="graphiql-header-actions">
            <SplitButton
              model={sampleMenuItems}
              label={`Samples: ${selectedSampleLabel}`}
              icon="pi pi-list"
              text
              size="small"
              onClick={() => {
                const sample = samples.find((entry) => entry.label === selectedSampleLabel) ?? samples[0]!;
                applySample(sample);
              }}
            />
            <Button text size="small" icon="pi pi-sliders-h" label="Headers & Variables" onClick={() => setHeadersDialogOpen(true)} />
          </div>
        )}
      />
      <div className="pageBodyFlex splitFill">
        <Splitter layout="vertical" className="splitFill" style={{ width: '100%' }}>
          <SplitterPanel size={74} minSize={45}>
            <div className="devtools-editor splitFill graphiql-host">
              <GraphiQL
                className="ch-graphiql"
                key={`${editorSeed}-${useSessionToken ? 'session' : 'manual'}`}
                fetcher={fetcher}
                defaultQuery={query}
                defaultHeaders={headersEditor}
                defaultEditorToolsVisibility={false}
                onEditQuery={(value) => setActiveQuery(value)}
                onEditVariables={(value) => setVariables(value)}
              />
            </div>
          </SplitterPanel>
          <SplitterPanel size={26} minSize={12}>
            <div className="pane splitPane">
              <Accordion multiple>
                <AccordionTab
                  header={(
                    <div className="inline-actions" style={{ justifyContent: 'space-between', width: '100%' }}>
                      <span>Explorer</span>
                      <Button text size="small" label="Reload" icon="pi pi-refresh" onClick={() => void loadSchemaExplorer()} loading={schemaLoading} />
                    </div>
                  )}
                >
                  {schemaError ? <small className="editor-error">{schemaError}</small> : null}
                  <Tree
                    value={schemaNodes}
                    className="ch-graphiql-explorer-tree"
                    filter
                    selectionMode="single"
                    selectionKeys={explorerSelectionKeys}
                    filterPlaceholder="Filter fields"
                    onSelectionChange={(event) => setExplorerSelectionKeys((event.value as string | null) ?? null)}
                    onSelect={(event) => {
                      const nodeData = event.node.data as { fieldName?: string; operation?: 'query' | 'mutation'; args?: Array<{ name: string; type: string }> } | undefined;
                      if (!nodeData?.fieldName || !nodeData.operation) {
                        return;
                      }
                      insertOperationFromExplorer(nodeData);
                    }}
                  />
                </AccordionTab>
                <AccordionTab
                  header={(
                    <div className="inline-actions" style={{ justifyContent: 'space-between', width: '100%' }}>
                      <span>Response Inspector</span>
                      <div className="inline-actions">
                        <Button text size="small" label="Clear" onClick={() => setLastResponse('')} />
                        <Button text size="small" label="Copy" onClick={() => navigator.clipboard.writeText(lastResponse)} disabled={!lastResponse} />
                        <Button
                          text
                          size="small"
                          label="Copy cURL"
                          onClick={() => {
                            const curl = `curl -X POST '${endpoint}' -H 'content-type: application/json' -d '${JSON.stringify(buildPayload()).replace(/'/g, "\\'")}'`;
                            navigator.clipboard.writeText(curl);
                          }}
                        />
                      </div>
                    </div>
                  )}
                >
                  <pre className="devtools-response-pre">{lastResponse || 'Run an operation to inspect raw response JSON.'}</pre>
                </AccordionTab>
              </Accordion>
            </div>
          </SplitterPanel>
        </Splitter>
      </div>
      <Dialog
        header="Headers & Variables"
        visible={headersDialogOpen}
        onHide={() => setHeadersDialogOpen(false)}
        style={{ width: 'min(52rem, 96vw)' }}
      >
        <div className="form-row">
          <div className="inline-actions">
            <Button
              size="small"
              label={useSessionToken ? 'Session Auth: On' : 'Session Auth: Off'}
              onClick={() => setUseSessionToken((prev) => !prev)}
            />
            <Button size="small" label="Copy Auth" onClick={() => navigator.clipboard.writeText(token ? `Bearer ${token}` : '')} disabled={!token} />
            <Button
              size="small"
              label="Prettify Query"
              onClick={() => {
                const text = (activeQuery || query).replace(/\s+/g, ' ').replace(/\s*\{\s*/g, ' {\n  ').replace(/\s*\}\s*/g, '\n}\n');
                setQuery(text.trim());
                setActiveQuery(text.trim());
                setEditorSeed((prev) => prev + 1);
              }}
            />
            <Button
              size="small"
              label="Copy fetch()"
              onClick={() => {
                const fetchCode = `fetch('${endpoint}', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(${JSON.stringify(buildPayload())}) });`;
                navigator.clipboard.writeText(fetchCode);
              }}
            />
          </div>
          <label htmlFor="preview-token">x-preview-token</label>
          <InputText id="preview-token" value={previewToken} onChange={(event) => setPreviewToken(event.target.value)} />
          <label>Header JSON override</label>
          <InputTextarea rows={8} value={headersEditor} onChange={(event) => setHeadersEditor(event.target.value)} />
          {headersError ? <small className="editor-error">{headersError}</small> : null}
          <label>Variables JSON</label>
          <InputTextarea rows={8} value={variables} onChange={(event) => setVariables(event.target.value)} />
        </div>
      </Dialog>
    </div>
  );
}
