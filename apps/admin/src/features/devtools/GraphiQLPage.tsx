import { useEffect, useMemo, useState } from 'react';
import { GraphiQL } from 'graphiql';
import type { Fetcher } from '@graphiql/toolkit';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Tree } from 'primereact/tree';
import type { TreeNode } from 'primereact/treenode';

import { useAuth } from '../../app/AuthContext';
import { useUi } from '../../app/UiContext';
import { applyMonacoTheme } from '../../theme/themeBridge';
import { WorkspaceActionBar, WorkspaceBody, WorkspaceHeader, WorkspacePage } from '../../ui/molecules';

import 'graphiql/style.css';

const INTROSPECTION_QUERY = `
  query IntrospectionQuery {
    __schema {
      queryType { name }
      mutationType { name }
      types {
        kind
        name
        description
        fields {
          name
          description
          args {
            name
            description
            type { kind name ofType { kind name ofType { kind name } } }
          }
          type { kind name ofType { kind name ofType { kind name } } }
        }
        inputFields {
          name
          description
          type { kind name ofType { kind name ofType { kind name } } }
        }
        enumValues {
          name
          description
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
  description?: string | null;
  args?: Array<{ name: string; type: IntrospectionTypeRef }> | null;
  type: IntrospectionTypeRef;
};

type IntrospectionType = {
  kind: string;
  name: string;
  description?: string | null;
  fields?: IntrospectionField[] | null;
  inputFields?: Array<{ name: string; description?: string | null; type: IntrospectionTypeRef }> | null;
  enumValues?: Array<{ name: string; description?: string | null }> | null;
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
  const { theme } = useUi();
  const endpoint = `${import.meta.env.VITE_API_URL ?? 'http://localhost:4000/graphql'}`;
  const [previewToken, setPreviewToken] = useState('');
  const [useSessionToken, setUseSessionToken] = useState(true);
  const [query, setQuery] = useState('');
  const [variables, setVariables] = useState('{}');
  const [headersEditor, setHeadersEditor] = useState('{}');
  const [headersError, setHeadersError] = useState('');
  const [editorSeed, setEditorSeed] = useState(0);
  const [activeQuery, setActiveQuery] = useState('');
  const [lastResponse, setLastResponse] = useState('');
  const [schemaNodes, setSchemaNodes] = useState<TreeNode[]>([]);
  const [docsNodes, setDocsNodes] = useState<TreeNode[]>([]);
  const [schemaError, setSchemaError] = useState('');
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [explorerSelectionKeys, setExplorerSelectionKeys] = useState<string | null>(null);
  const [docsSelectionKeys, setDocsSelectionKeys] = useState<string | null>(null);
  const [centerPanels, setCenterPanels] = useState<number[]>([0, 1, 2]);

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
      const docTree: TreeNode[] = __schema.types
        .filter((type) => type.name && !type.name.startsWith('__'))
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((type) => ({
          key: `type-${type.name}`,
          label: `${type.name} (${type.kind})`,
          children: [
            ...(type.description ? [{ key: `type-${type.name}-description`, label: type.description }] : []),
            ...((type.fields ?? []).map((field) => ({
              key: `type-${type.name}-field-${field.name}`,
              label: `${field.name}: ${formatType(field.type)}`,
              children: [
                ...(field.description ? [{ key: `type-${type.name}-field-${field.name}-description`, label: field.description }] : []),
                ...((field.args ?? []).map((arg) => ({
                  key: `type-${type.name}-field-${field.name}-arg-${arg.name}`,
                  label: `arg ${arg.name}: ${formatType(arg.type)}`
                })))
              ]
            }))),
            ...((type.inputFields ?? []).map((field) => ({
              key: `type-${type.name}-input-${field.name}`,
              label: `input ${field.name}: ${formatType(field.type)}`
            }))),
            ...((type.enumValues ?? []).map((entry) => ({
              key: `type-${type.name}-enum-${entry.name}`,
              label: `enum ${entry.name}`
            })))
          ]
        }));
      setSchemaNodes(nextNodes);
      setDocsNodes(docTree);
    } catch (error) {
      setSchemaError(error instanceof Error ? error.message : 'Failed to load schema.');
      setSchemaNodes([]);
      setDocsNodes([]);
    } finally {
      setSchemaLoading(false);
    }
  };

  useEffect(() => {
    void import('monaco-editor').then((monaco) => {
      applyMonacoTheme(theme, monaco);
    }).catch(() => undefined);
  }, [theme]);

  useEffect(() => {
    void loadSchemaExplorer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, parsedHeaders]);

  return (
    <WorkspacePage>
      <WorkspaceHeader
        title="GraphiQL Dev Tool"
        subtitle="GraphQL playground with docs, explorer, variables, headers, and response inspector."
        helpTopicKey="graphiql"
      />
      <WorkspaceActionBar
        primary={(
          <Button text size="small" icon="pi pi-refresh" label="Reload Schema" onClick={() => void loadSchemaExplorer()} loading={schemaLoading} />
        )}
      />
      <WorkspaceBody>
        <Splitter className="splitFill ch-graphiql-ide">
          <SplitterPanel size={22} minSize={16}>
            <div className="paneRoot ch-graphiql-pane ch-graphiql-pane-left">
                  <div className="inline-actions justify-content-between mb-2"><span>Operations</span></div>
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
            </div>
          </SplitterPanel>
          <SplitterPanel size={48} minSize={34}>
            <div className="paneRoot ch-graphiql-pane ch-graphiql-pane-center">
              <Accordion
                className="ch-graphiql-center-accordion"
                multiple
                activeIndex={centerPanels}
                onTabChange={(event) => setCenterPanels(Array.isArray(event.index) ? event.index : [])}
              >
                <AccordionTab
                  header="Query Editor"
                >
                  <div className="devtools-editor splitFill graphiql-host ch-graphiql-editor-host">
                    <GraphiQL
                      className="ch-graphiql"
                      key={`${editorSeed}-${useSessionToken ? 'session' : 'manual'}`}
                      fetcher={fetcher}
                      defaultQuery={query}
                      initialQuery={query}
                      initialVariables={variables}
                      initialHeaders={headersEditor}
                      defaultHeaders={headersEditor}
                      defaultEditorToolsVisibility={false}
                      onEditQuery={(value) => setActiveQuery(value)}
                      onEditVariables={(value) => setVariables(value)}
                    />
                  </div>
                </AccordionTab>
                <AccordionTab header="Variables">
                  <div className="form-row">
                    <div className="inline-actions">
                      <Button size="small" label="Apply Variables" onClick={() => setEditorSeed((prev) => prev + 1)} />
                    </div>
                    <InputTextarea rows={8} value={variables} onChange={(event) => setVariables(event.target.value)} />
                  </div>
                </AccordionTab>
                <AccordionTab header="Headers">
                  <div className="form-row">
                    <div className="inline-actions">
                      <Button
                        size="small"
                        label={useSessionToken ? 'Use Session Token: On' : 'Use Session Token: Off'}
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
                    <label htmlFor="headers-editor">Headers JSON</label>
                    <InputTextarea id="headers-editor" rows={8} value={headersEditor} onChange={(event) => setHeadersEditor(event.target.value)} />
                    {headersError ? <small className="editor-error">{headersError}</small> : null}
                    <div className="inline-actions">
                      <Button size="small" label="Apply Headers" onClick={() => setEditorSeed((prev) => prev + 1)} />
                    </div>
                  </div>
                </AccordionTab>
              </Accordion>
            </div>
          </SplitterPanel>
          <SplitterPanel size={30} minSize={20}>
            <div className="paneRoot ch-graphiql-pane ch-graphiql-pane-right">
              <div className="inline-actions justify-content-between">
                <span>Result</span>
                <div className="inline-actions">
                  <Button text size="small" label="Clear" onClick={() => setLastResponse('')} />
                  <Button text size="small" label="Copy" onClick={() => navigator.clipboard.writeText(lastResponse)} disabled={!lastResponse} />
                </div>
              </div>
              <pre className="devtools-response-pre ch-graphiql-response-pre">{lastResponse || 'Run an operation to inspect raw response JSON.'}</pre>
            </div>
          </SplitterPanel>
        </Splitter>
      </WorkspaceBody>
    </WorkspacePage>
  );
}

