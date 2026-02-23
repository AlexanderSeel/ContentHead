import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Toolbar } from 'primereact/toolbar';
export function PageHeader({ title, subtitle, actions }) {
    return (_jsx(Toolbar, { className: "page-header", start: _jsxs("div", { children: [_jsx("h2", { children: title }), subtitle ? _jsx("p", { children: subtitle }) : null] }), end: _jsx("div", { className: "page-header-actions", children: actions }) }));
}
