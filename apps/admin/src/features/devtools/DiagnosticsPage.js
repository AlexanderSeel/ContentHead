import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from 'primereact/card';
import { PageHeader } from '../../components/common/PageHeader';
export function DiagnosticsPage() {
    return (_jsxs("div", { children: [_jsx(PageHeader, { title: "Diagnostics", subtitle: "Build and environment info" }), _jsx(Card, { children: _jsx("pre", { children: JSON.stringify({
                        mode: import.meta.env.MODE,
                        dev: import.meta.env.DEV,
                        apiUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:4000/graphql'
                    }, null, 2) }) })] }));
}
