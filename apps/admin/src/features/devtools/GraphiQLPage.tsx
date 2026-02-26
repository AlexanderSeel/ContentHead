import { useEffect, useMemo, useState } from 'react';
import { GraphiQL } from 'graphiql';
import type { Fetcher, FetcherOpts, Storage as GraphiQLStorage } from '@graphiql/toolkit';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';

import { useAuth } from '../../app/AuthContext';
import { useUi } from '../../app/UiContext';
import { applyMonacoTheme } from '../../theme/themeBridge';
import { WorkspaceActionBar, WorkspaceBody, WorkspaceHeader, WorkspacePage } from '../../ui/molecules';

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
  const { theme } = useUi();
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

  useEffect(() => {
    void import('monaco-editor')
      .then((monaco) => {
        applyMonacoTheme(theme, monaco);
      })
      .catch(() => undefined);
  }, [theme]);

  return (
    <WorkspacePage>
      <WorkspaceHeader
        title="GraphiQL Dev Tool"
        subtitle="GraphQL playground with the standard query editor layout."
        helpTopicKey="graphiql"
      />
      <WorkspaceActionBar
        primary={(
          <div className="graphiql-header-actions">
            <Button
              size="small"
              label={useSessionToken ? 'Session Auth: On' : 'Session Auth: Off'}
              onClick={() => setUseSessionToken((prev) => !prev)}
            />
            <InputText
              value={previewToken}
              onChange={(event) => setPreviewToken(event.target.value)}
              placeholder="x-preview-token (optional)"
            />
          </div>
        )}
      />
      <WorkspaceBody>
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
      </WorkspaceBody>
    </WorkspacePage>
  );
}
