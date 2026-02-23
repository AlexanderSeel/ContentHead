import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { GraphiQL } from 'graphiql';
import { explorerPlugin } from '@graphiql/plugin-explorer';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Panel } from 'primereact/panel';
import { PageHeader } from '../../components/common/PageHeader';
import { useAuth } from '../../app/AuthContext';
import 'graphiql/graphiql.css';
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
export function GraphiQLPage() {
    const { token } = useAuth();
    const endpoint = `${import.meta.env.VITE_API_URL ?? 'http://localhost:4000/graphql'}`;
    const [previewToken, setPreviewToken] = useState('');
    const [useSessionToken, setUseSessionToken] = useState(true);
    const [query, setQuery] = useState(samples[0].query);
    const [variables, setVariables] = useState(samples[0].variables ?? '{}');
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
        return response.json();
    }, [endpoint, parsedHeaders]);
    return (_jsxs("div", { children: [_jsx(PageHeader, { title: "GraphiQL Dev Tool", subtitle: "SWAPI-like GraphQL playground with samples, docs, explorer, variables and headers." }), _jsxs("div", { className: "devtools-layout", children: [_jsxs("aside", { className: "devtools-sidebar", children: [_jsx(Panel, { header: "Samples", children: _jsx("div", { className: "sample-list", children: samples.map((sample) => (_jsx(Button, { text: true, label: sample.label, onClick: () => {
                                            setQuery(sample.query);
                                            setVariables(sample.variables ?? '{}');
                                            setEditorSeed((prev) => prev + 1);
                                        } }, sample.label))) }) }), _jsxs(Panel, { header: "Headers", children: [_jsxs("div", { className: "inline-actions", children: [_jsx(Button, { size: "small", label: useSessionToken ? 'Session Auth: On' : 'Session Auth: Off', onClick: () => setUseSessionToken((prev) => !prev) }), _jsx(Button, { size: "small", label: "Copy Auth", onClick: () => navigator.clipboard.writeText(token ? `Bearer ${token}` : ''), disabled: !token })] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { htmlFor: "preview-token", children: "x-preview-token" }), _jsx(InputText, { id: "preview-token", value: previewToken, onChange: (event) => setPreviewToken(event.target.value) })] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Header JSON override" }), _jsx(InputTextarea, { rows: 8, value: headersEditor, onChange: (event) => setHeadersEditor(event.target.value) }), headersError ? _jsx("small", { className: "editor-error", children: headersError }) : null] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Sample variables" }), _jsx(InputTextarea, { rows: 4, value: variables, onChange: (event) => setVariables(event.target.value) })] })] })] }), _jsx("div", { className: "devtools-editor", children: _jsx(GraphiQL, { fetcher: fetcher, defaultQuery: query, defaultHeaders: headersEditor, defaultEditorToolsVisibility: true, plugins: [explorerPlugin()] }, `${editorSeed}-${useSessionToken ? 'session' : 'manual'}`) })] })] }));
}
