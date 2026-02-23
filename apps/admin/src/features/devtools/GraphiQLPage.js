import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { GraphiQL } from 'graphiql';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { SplitButton } from 'primereact/splitbutton';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Tree } from 'primereact/tree';
import { PageHeader } from '../../components/common/PageHeader';
import { useAuth } from '../../app/AuthContext';
import 'graphiql/style.css';
const samples = [
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
function formatType(type) {
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
    const [query, setQuery] = useState(samples[0].query);
    const [variables, setVariables] = useState(samples[0].variables ?? '{}');
    const [headersEditor, setHeadersEditor] = useState('{}');
    const [headersError, setHeadersError] = useState('');
    const [headersDialogOpen, setHeadersDialogOpen] = useState(false);
    const [editorSeed, setEditorSeed] = useState(0);
    const [activeQuery, setActiveQuery] = useState(samples[0].query);
    const [lastResponse, setLastResponse] = useState('');
    const [schemaNodes, setSchemaNodes] = useState([]);
    const [schemaError, setSchemaError] = useState('');
    const [schemaLoading, setSchemaLoading] = useState(false);
    const [explorerSelectionKeys, setExplorerSelectionKeys] = useState(null);
    const buildPayload = () => {
        let parsedVariables = {};
        try {
            parsedVariables = JSON.parse(variables || '{}');
        }
        catch {
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
            const parsed = JSON.parse(headersEditor);
            setHeadersError('');
            return parsed;
        }
        catch (error) {
            setHeadersError(error instanceof Error ? error.message : 'Invalid JSON');
            return {};
        }
    }, [headersEditor]);
    const fetcher = useMemo(() => async (graphQLParams) => {
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
                ? String(graphQLParams.query ?? '')
                : '';
        const isIntrospection = queryText.includes('__schema') || queryText.includes('__type') || queryText.includes('IntrospectionQuery');
        if (!isIntrospection) {
            setLastResponse(JSON.stringify(json, null, 2));
        }
        return json;
    }, [endpoint, parsedHeaders]);
    const sampleMenuItems = useMemo(() => samples.map((sample) => ({
        label: sample.label,
        command: () => {
            setQuery(sample.query);
            setActiveQuery(sample.query);
            setVariables(sample.variables ?? '{}');
            setEditorSeed((prev) => prev + 1);
        }
    })), []);
    const insertOperationFromExplorer = (nodeData) => {
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
            const nextVars = args.reduce((acc, arg) => {
                if (arg.type.includes('Int') || arg.type.includes('Float')) {
                    acc[arg.name] = 0;
                }
                else if (arg.type.includes('Boolean')) {
                    acc[arg.name] = false;
                }
                else {
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
            const json = await response.json();
            if (!json.data) {
                setSchemaError(json.errors?.[0]?.message ?? 'Introspection failed.');
                setSchemaNodes([]);
                return;
            }
            const { __schema } = json.data;
            const typesByName = new Map(__schema.types.map((type) => [type.name, type]));
            const queryType = __schema.queryType?.name ? typesByName.get(__schema.queryType.name) : undefined;
            const mutationType = __schema.mutationType?.name ? typesByName.get(__schema.mutationType.name) : undefined;
            const nextNodes = [];
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
        }
        catch (error) {
            setSchemaError(error instanceof Error ? error.message : 'Failed to load schema.');
            setSchemaNodes([]);
        }
        finally {
            setSchemaLoading(false);
        }
    };
    useEffect(() => {
        void loadSchemaExplorer();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [endpoint, parsedHeaders]);
    return (_jsxs("div", { className: "pageRoot", children: [_jsx(PageHeader, { title: "GraphiQL Dev Tool", subtitle: "SWAPI-like GraphQL playground with samples, docs, explorer, variables and headers.", helpTopicKey: "graphiql", askAiContext: "graphql", askAiPayload: { endpoint, query: activeQuery, variables, headers: headersEditor }, onAskAiInsert: (value) => {
                    setQuery(value);
                    setActiveQuery(value);
                    setEditorSeed((prev) => prev + 1);
                }, actions: (_jsxs("div", { className: "graphiql-header-actions", children: [_jsx(SplitButton, { model: sampleMenuItems, label: "Samples", icon: "pi pi-list", text: true, size: "small" }), _jsx(Button, { text: true, size: "small", icon: "pi pi-sliders-h", label: "Headers & Variables", onClick: () => setHeadersDialogOpen(true) })] })) }), _jsx("div", { className: "pageBodyFlex splitFill", children: _jsxs(Splitter, { layout: "vertical", className: "splitFill", style: { width: '100%' }, children: [_jsx(SplitterPanel, { size: 74, minSize: 45, children: _jsx("div", { className: "devtools-editor splitFill graphiql-host", children: _jsx(GraphiQL, { className: "ch-graphiql", fetcher: fetcher, defaultQuery: query, defaultHeaders: headersEditor, defaultEditorToolsVisibility: false, onEditQuery: (value) => setActiveQuery(value), onEditVariables: (value) => setVariables(value) }, `${editorSeed}-${useSessionToken ? 'session' : 'manual'}`) }) }), _jsx(SplitterPanel, { size: 26, minSize: 12, children: _jsx("div", { className: "pane splitPane", children: _jsxs(Accordion, { multiple: true, children: [_jsxs(AccordionTab, { header: (_jsxs("div", { className: "inline-actions", style: { justifyContent: 'space-between', width: '100%' }, children: [_jsx("span", { children: "Explorer" }), _jsx(Button, { text: true, size: "small", label: "Reload", icon: "pi pi-refresh", onClick: () => void loadSchemaExplorer(), loading: schemaLoading })] })), children: [schemaError ? _jsx("small", { className: "editor-error", children: schemaError }) : null, _jsx(Tree, { value: schemaNodes, className: "ch-graphiql-explorer-tree", filter: true, selectionMode: "single", selectionKeys: explorerSelectionKeys, filterPlaceholder: "Filter fields", onSelectionChange: (event) => setExplorerSelectionKeys(event.value ?? null), onSelect: (event) => {
                                                        const nodeData = event.node.data;
                                                        if (!nodeData?.fieldName || !nodeData.operation) {
                                                            return;
                                                        }
                                                        insertOperationFromExplorer(nodeData);
                                                    } })] }), _jsx(AccordionTab, { header: (_jsxs("div", { className: "inline-actions", style: { justifyContent: 'space-between', width: '100%' }, children: [_jsx("span", { children: "Response Inspector" }), _jsxs("div", { className: "inline-actions", children: [_jsx(Button, { text: true, size: "small", label: "Clear", onClick: () => setLastResponse('') }), _jsx(Button, { text: true, size: "small", label: "Copy", onClick: () => navigator.clipboard.writeText(lastResponse), disabled: !lastResponse }), _jsx(Button, { text: true, size: "small", label: "Copy cURL", onClick: () => {
                                                                    const curl = `curl -X POST '${endpoint}' -H 'content-type: application/json' -d '${JSON.stringify(buildPayload()).replace(/'/g, "\\'")}'`;
                                                                    navigator.clipboard.writeText(curl);
                                                                } })] })] })), children: _jsx("pre", { className: "devtools-response-pre", children: lastResponse || 'Run an operation to inspect raw response JSON.' }) })] }) }) })] }) }), _jsx(Dialog, { header: "Headers & Variables", visible: headersDialogOpen, onHide: () => setHeadersDialogOpen(false), style: { width: 'min(52rem, 96vw)' }, children: _jsxs("div", { className: "form-row", children: [_jsxs("div", { className: "inline-actions", children: [_jsx(Button, { size: "small", label: useSessionToken ? 'Session Auth: On' : 'Session Auth: Off', onClick: () => setUseSessionToken((prev) => !prev) }), _jsx(Button, { size: "small", label: "Copy Auth", onClick: () => navigator.clipboard.writeText(token ? `Bearer ${token}` : ''), disabled: !token }), _jsx(Button, { size: "small", label: "Prettify Query", onClick: () => {
                                        const text = (activeQuery || query).replace(/\s+/g, ' ').replace(/\s*\{\s*/g, ' {\n  ').replace(/\s*\}\s*/g, '\n}\n');
                                        setQuery(text.trim());
                                        setActiveQuery(text.trim());
                                        setEditorSeed((prev) => prev + 1);
                                    } }), _jsx(Button, { size: "small", label: "Copy fetch()", onClick: () => {
                                        const fetchCode = `fetch('${endpoint}', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(${JSON.stringify(buildPayload())}) });`;
                                        navigator.clipboard.writeText(fetchCode);
                                    } })] }), _jsx("label", { htmlFor: "preview-token", children: "x-preview-token" }), _jsx(InputText, { id: "preview-token", value: previewToken, onChange: (event) => setPreviewToken(event.target.value) }), _jsx("label", { children: "Header JSON override" }), _jsx(InputTextarea, { rows: 8, value: headersEditor, onChange: (event) => setHeadersEditor(event.target.value) }), headersError ? _jsx("small", { className: "editor-error", children: headersError }) : null, _jsx("label", { children: "Variables JSON" }), _jsx(InputTextarea, { rows: 8, value: variables, onChange: (event) => setVariables(event.target.value) })] }) })] }));
}
