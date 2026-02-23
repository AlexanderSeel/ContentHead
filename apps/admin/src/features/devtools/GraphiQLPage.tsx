import { useEffect, useMemo, useState } from 'react';
import { GraphiQL } from 'graphiql';
import type { Fetcher } from '@graphiql/toolkit';
import { explorerPlugin } from '@graphiql/plugin-explorer';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Panel } from 'primereact/panel';

import { PageHeader } from '../../components/common/PageHeader';
import { useAuth } from '../../app/AuthContext';

import 'graphiql/graphiql.css';

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

export function GraphiQLPage() {
  const { token } = useAuth();
  const endpoint = `${import.meta.env.VITE_API_URL ?? 'http://localhost:4000/graphql'}`;
  const [previewToken, setPreviewToken] = useState('');
  const [useSessionToken, setUseSessionToken] = useState(true);
  const [query, setQuery] = useState(samples[0]!.query);
  const [variables, setVariables] = useState(samples[0]!.variables ?? '{}');
  const [headersEditor, setHeadersEditor] = useState('{}');
  const [headersError, setHeadersError] = useState('');
  const [editorSeed, setEditorSeed] = useState(0);

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
      return response.json();
    },
    [endpoint, parsedHeaders]
  );

  return (
    <div>
      <PageHeader title="GraphiQL Dev Tool" subtitle="SWAPI-like GraphQL playground with samples, docs, explorer, variables and headers." />
      <div className="devtools-layout">
        <aside className="devtools-sidebar">
          <Panel header="Samples">
            <div className="sample-list">
              {samples.map((sample) => (
                <Button
                  key={sample.label}
                  text
                  label={sample.label}
                  onClick={() => {
                    setQuery(sample.query);
                    setVariables(sample.variables ?? '{}');
                    setEditorSeed((prev) => prev + 1);
                  }}
                />
              ))}
            </div>
          </Panel>
          <Panel header="Headers">
            <div className="inline-actions">
              <Button
                size="small"
                label={useSessionToken ? 'Session Auth: On' : 'Session Auth: Off'}
                onClick={() => setUseSessionToken((prev) => !prev)}
              />
              <Button size="small" label="Copy Auth" onClick={() => navigator.clipboard.writeText(token ? `Bearer ${token}` : '')} disabled={!token} />
            </div>
            <div className="form-row">
              <label htmlFor="preview-token">x-preview-token</label>
              <InputText id="preview-token" value={previewToken} onChange={(event) => setPreviewToken(event.target.value)} />
            </div>
            <div className="form-row">
              <label>Header JSON override</label>
              <InputTextarea rows={8} value={headersEditor} onChange={(event) => setHeadersEditor(event.target.value)} />
              {headersError ? <small className="editor-error">{headersError}</small> : null}
            </div>
            <div className="form-row">
              <label>Sample variables</label>
              <InputTextarea rows={4} value={variables} onChange={(event) => setVariables(event.target.value)} />
            </div>
          </Panel>
        </aside>
        <div className="devtools-editor">
          <GraphiQL
            key={`${editorSeed}-${useSessionToken ? 'session' : 'manual'}`}
            fetcher={fetcher}
            defaultQuery={query}
            defaultHeaders={headersEditor}
            defaultEditorToolsVisibility={true}
            plugins={[explorerPlugin()]}
          />
        </div>
      </div>
    </div>
  );
}
