import { useMemo, useState } from 'react';
import { GraphiQL } from 'graphiql';
import type { Fetcher, FetcherOpts, Storage as GraphiQLStorage } from '@graphiql/toolkit';
import { useAuth } from '../../app/AuthContext';
import { Button, TextInput } from '../../ui/atoms';
import { WorkspaceBody, WorkspaceHeader, WorkspacePage, WorkspacePaneLayout, WorkspaceToolbar } from '../../ui/molecules';

import 'graphiql/style.css';

const DEFAULT_QUERY = `query Example {
  __typename
}`;

function createInMemoryStorage(): GraphiQLStorage {
  const entries = new Map<string, string>();
  return {
    get length() {
      return entries.size;
    },
    getItem(key: string) {
      return entries.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      entries.set(key, value);
    },
    removeItem(key: string) {
      entries.delete(key);
    },
    clear() {
      entries.clear();
    }
  };
}

export function GraphiQLPage() {
  const { token } = useAuth();
  const endpoint = `${import.meta.env.VITE_API_URL ?? 'http://localhost:4000/graphql'}`;
  const [previewToken, setPreviewToken] = useState('');
  const [useSessionToken, setUseSessionToken] = useState(true);

  const baseHeaders = useMemo<Record<string, string>>(
    () => ({
      ...(useSessionToken && token ? { authorization: `Bearer ${token}` } : {}),
      ...(previewToken.trim() ? { 'x-preview-token': previewToken.trim() } : {})
    }),
    [previewToken, token, useSessionToken]
  );

  const defaultHeaders = useMemo(() => JSON.stringify(baseHeaders, null, 2), [baseHeaders]);
  const storage = useMemo(() => createInMemoryStorage(), []);

  const fetcher = useMemo<Fetcher>(
    () => async (graphQLParams, fetcherOpts?: FetcherOpts) => {
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'content-type': 'application/json',
          ...baseHeaders,
          ...(fetcherOpts?.headers ?? {})
        },
        body: JSON.stringify(graphQLParams)
      });
      return response.json();
    },
    [baseHeaders, endpoint]
  );

  return (
    <WorkspacePage>
      <WorkspaceHeader
        title="GraphiQL Dev Tool"
        subtitle="GraphQL playground with the standard query editor layout."
        helpTopicKey="graphiql"
      />
      <WorkspaceToolbar defaultExpanded>
        <div className="inline-actions">
          <Button
            size="small"
            label={useSessionToken ? 'Session Auth: On' : 'Session Auth: Off'}
            onClick={() => setUseSessionToken((prev) => !prev)}
          />
          <TextInput
            value={previewToken}
            onChange={(next) => setPreviewToken(next)}
            placeholder="x-preview-token (optional)"
          />
        </div>
      </WorkspaceToolbar>
      <WorkspaceBody>
        <WorkspacePaneLayout
          workspaceId="dev-graphiql"
          left={{
            id: 'explorer',
            label: 'Explorer',
            defaultSize: 18,
            minSize: 12,
            collapsible: true,
            content: (
              <div className="form-row">
                <label>Endpoint</label>
                <TextInput value={endpoint} readOnly />
                <small className="muted">Use the center editor to run queries and mutations.</small>
              </div>
            )
          }}
          center={{
            id: 'editor',
            label: 'Editor',
            defaultSize: 54,
            minSize: 30,
            collapsible: false,
            content: (
              <div className="devtools-editor splitFill graphiql-host ch-graphiql-standard">
                <GraphiQL
                  className="ch-graphiql"
                  fetcher={fetcher}
                  storage={storage}
                  defaultQuery={DEFAULT_QUERY}
                  defaultHeaders={defaultHeaders}
                  defaultEditorToolsVisibility={false}
                />
              </div>
            )
          }}
          right={{
            id: 'result',
            label: 'Result',
            defaultSize: 28,
            minSize: 16,
            collapsible: true,
            content: (
              <div className="form-row">
                <label>Request Headers</label>
                <pre className="m-0">{defaultHeaders}</pre>
                <small className="muted">Results and schema docs are available directly in GraphiQL.</small>
              </div>
            )
          }}
        />
      </WorkspaceBody>
    </WorkspacePage>
  );
}
