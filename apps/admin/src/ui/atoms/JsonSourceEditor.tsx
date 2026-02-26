import { useEffect, useMemo, useRef } from 'react';
import type * as Monaco from 'monaco-editor';

import { useUi } from '../../app/UiContext';
import { applyMonacoTheme } from '../../theme/themeBridge';

const jsonSchemas = new Map<string, { uri: string; fileMatch: string[]; schema: Record<string, unknown> }>();

function refreshJsonSchemas(monaco: typeof Monaco) {
  monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
    validate: true,
    allowComments: false,
    schemas: Array.from(jsonSchemas.values())
  });
}

export function JsonSourceEditor({
  editorId,
  value,
  onChange,
  readOnly = false,
  height = 220,
  schema,
  className
}: {
  editorId: string;
  value: string;
  onChange?: (next: string) => void;
  readOnly?: boolean;
  height?: number;
  schema?: Record<string, unknown> | null;
  className?: string;
}) {
  const { theme } = useUi();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const monacoRef = useRef<typeof Monaco | null>(null);
  const modelRef = useRef<Monaco.editor.ITextModel | null>(null);
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const changeDisposableRef = useRef<Monaco.IDisposable | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const schemaUri = useMemo(() => `inmemory://schema/${editorId}.schema.json`, [editorId]);
  const modelUri = useMemo(() => `inmemory://model/${editorId}.json`, [editorId]);

  useEffect(() => {
    let active = true;
    void import('monaco-editor').then((monaco) => {
      if (!active || !containerRef.current) {
        return;
      }
      monacoRef.current = monaco;
      const uri = monaco.Uri.parse(modelUri);
      const existing = monaco.editor.getModel(uri);
      modelRef.current = existing ?? monaco.editor.createModel(value, 'json', uri);
      if (existing && existing.getValue() !== value) {
        existing.setValue(value);
      }
      editorRef.current = monaco.editor.create(containerRef.current, {
        model: modelRef.current,
        language: 'json',
        readOnly,
        automaticLayout: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        tabSize: 2
      });
      changeDisposableRef.current = editorRef.current.onDidChangeModelContent(() => {
        if (!onChange || !modelRef.current) {
          return;
        }
        onChange(modelRef.current.getValue());
      });
      resizeObserverRef.current = new ResizeObserver(() => {
        editorRef.current?.layout();
      });
      resizeObserverRef.current.observe(containerRef.current);
      requestAnimationFrame(() => editorRef.current?.layout());
      if (schema && schemaUri) {
        jsonSchemas.set(schemaUri, {
          uri: schemaUri,
          fileMatch: [uri.toString()],
          schema
        });
        refreshJsonSchemas(monaco);
      }
    });

    return () => {
      active = false;
      if (changeDisposableRef.current) {
        changeDisposableRef.current.dispose();
        changeDisposableRef.current = null;
      }
      if (editorRef.current) {
        editorRef.current.dispose();
        editorRef.current = null;
      }
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      if (modelRef.current) {
        modelRef.current.dispose();
        modelRef.current = null;
      }
      if (schema && schemaUri && monacoRef.current) {
        jsonSchemas.delete(schemaUri);
        refreshJsonSchemas(monacoRef.current);
      }
    };
  }, [modelUri, onChange, readOnly, schema, schemaUri]);

  useEffect(() => {
    const monaco = monacoRef.current;
    const model = modelRef.current;
    if (!monaco || !model) {
      return;
    }
    applyMonacoTheme(theme, monaco);
    if (model.getValue() !== value) {
      model.pushEditOperations(
        [],
        [{ range: model.getFullModelRange(), text: value }],
        () => null
      );
    }
  }, [theme, value]);

  return (
    <div
      ref={containerRef}
      className={['ch-json-source-editor', className].filter(Boolean).join(' ')}
      style={{
        height,
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        position: 'relative',
        isolation: 'isolate',
        zIndex: 0,
        overflow: 'hidden',
        border: '1px solid var(--surface-border)',
        borderRadius: 6
      }}
    />
  );
}
