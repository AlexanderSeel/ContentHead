import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { GraphiQL } from 'graphiql';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Panel } from 'primereact/panel';
import { PageHeader } from '../../components/common/PageHeader';
import { useAuth } from '../../app/AuthContext';
import 'graphiql/graphiql.css';
const samples = [
    {
        label: 'me',
        query: `query Me {\n  me { id username displayName }\n}`
    },
    {
        label: 'listSites',
        query: `query ListSites {\n  listSites { id name active }\n}`
    },
    {
        label: 'getSiteMarketLocaleMatrix',
        query: `query Matrix($siteId: Int!) {\n  getSiteMarketLocaleMatrix(siteId: $siteId) {\n    siteId\n    combinations { marketCode localeCode active }\n  }\n}`
    },
    {
        label: 'resolveRoute',
        query: `query ResolveRoute($siteId:Int!,$marketCode:String!,$localeCode:String!,$slug:String!){\n  resolveRoute(siteId:$siteId,marketCode:$marketCode,localeCode:$localeCode,slug:$slug){\n    mode\n    version { id versionNumber state }\n  }\n}`
    },
    {
        label: 'getPageByRoute',
        query: `query PageByRoute($siteId:Int!,$marketCode:String!,$localeCode:String!,$slug:String!,$contextJson:String){\n  getPageByRoute(siteId:$siteId,marketCode:$marketCode,localeCode:$localeCode,slug:$slug,contextJson:$contextJson){\n    selectionReason\n    selectedVariant { key }\n    selectedVersion { id state }\n  }\n}`
    },
    {
        label: 'listVersions',
        query: `query Versions($contentItemId:Int!){\n  listVersions(contentItemId:$contentItemId){ id versionNumber state }\n}`
    },
    {
        label: 'listWorkflowDefinitions',
        query: `query Workflows {\n  listWorkflowDefinitions { id name version }\n}`
    },
    {
        label: 'startWorkflowRun',
        query: `mutation StartRun($definitionId:Int!,$contextJson:String!){\n  startWorkflowRun(definitionId:$definitionId,contextJson:$contextJson){ id status currentNodeId }\n}`
    }
];
export function GraphiQLPage() {
    const { token } = useAuth();
    const [previewToken, setPreviewToken] = useState('');
    const [query, setQuery] = useState(samples[0]?.query ?? 'query { __typename }');
    const [useSessionToken, setUseSessionToken] = useState(true);
    const endpoint = `${import.meta.env.VITE_API_URL ?? 'http://localhost:4000/graphql'}`;
    const headers = useMemo(() => {
        const authHeader = useSessionToken && token ? `Bearer ${token}` : '';
        return {
            ...(authHeader ? { authorization: authHeader } : {}),
            ...(previewToken ? { 'x-preview-token': previewToken } : {})
        };
    }, [token, useSessionToken, previewToken]);
    const fetcher = useMemo(() => {
        return async (graphQLParams) => {
            const response = await fetch(endpoint, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'content-type': 'application/json',
                    ...headers
                },
                body: JSON.stringify(graphQLParams)
            });
            return response.json();
        };
    }, [endpoint, headers]);
    return (_jsxs("div", { children: [_jsx(PageHeader, { title: "GraphQL / GraphiQL Test", subtitle: "Dev-only API playground" }), _jsxs("div", { className: "devtools-layout", children: [_jsxs(Panel, { header: "Samples", className: "devtools-samples", children: [_jsxs("div", { className: "inline-actions", children: [_jsx(Button, { label: useSessionToken ? 'Using Session Token' : 'Session Token Disabled', onClick: () => setUseSessionToken((prev) => !prev) }), _jsx(Button, { label: "Copy Auth Header", onClick: () => navigator.clipboard.writeText(headers.authorization ?? ''), disabled: !headers.authorization })] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Preview Token (optional)" }), _jsx(InputText, { value: previewToken, onChange: (event) => setPreviewToken(event.target.value) })] }), _jsx("div", { className: "sample-list", children: samples.map((sample) => (_jsx(Button, { className: "p-button-text", label: sample.label, onClick: () => setQuery(sample.query) }, sample.label))) })] }), _jsx("div", { className: "devtools-editor", children: _jsx(GraphiQL, { fetcher: fetcher, defaultQuery: query, onEditQuery: setQuery, defaultEditorToolsVisibility: true }, query) })] })] }));
}
