import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from 'primereact/card';
import { PageHeader } from '../../components/common/PageHeader';
import { useAdminContext } from '../../app/AdminContext';
import { useUi } from '../../app/UiContext';
import { readCssVar } from '../../theme/themeManager';
export function DiagnosticsPage() {
    const { siteId, marketCode, localeCode } = useAdminContext();
    const { theme, scale } = useUi();
    const tokens = [
        '--surface-ground',
        '--surface-card',
        '--surface-overlay',
        '--surface-border',
        '--text-color',
        '--text-color-secondary',
        '--primary-color'
    ];
    return (_jsxs("div", { children: [_jsx(PageHeader, { title: "Diagnostics", subtitle: "Build and environment info" }), _jsx(Card, { children: _jsxs("div", { className: "diagnostics-grid", children: [_jsxs("div", { className: "status-panel", children: [_jsx("strong", { children: "Site" }), _jsxs("div", { children: ["#", siteId] })] }), _jsxs("div", { className: "status-panel", children: [_jsx("strong", { children: "Market" }), _jsx("div", { children: marketCode })] }), _jsxs("div", { className: "status-panel", children: [_jsx("strong", { children: "Locale" }), _jsx("div", { children: localeCode })] }), _jsxs("div", { className: "status-panel", children: [_jsx("strong", { children: "Theme" }), _jsx("div", { children: theme })] }), _jsxs("div", { className: "status-panel", children: [_jsx("strong", { children: "Scale" }), _jsxs("div", { children: [scale, "px"] })] }), _jsxs("div", { className: "status-panel", children: [_jsx("strong", { children: "API" }), _jsx("div", { children: import.meta.env.VITE_API_URL ?? 'http://localhost:4000/graphql' })] }), _jsxs("div", { className: "status-panel", children: [_jsx("strong", { children: "Mode" }), _jsx("div", { children: import.meta.env.MODE })] }), _jsxs("div", { className: "status-panel", children: [_jsx("strong", { children: "Build" }), _jsx("div", { children: import.meta.env.VITE_BUILD_SHA ?? 'local-dev' })] })] }) }), _jsx(Card, { title: "Theme Diagnostics", children: _jsx("div", { className: "diagnostics-grid", children: tokens.map((tokenName) => (_jsxs("div", { className: "status-panel", children: [_jsx("strong", { children: tokenName }), _jsx("div", { children: readCssVar(tokenName) || '(not set)' })] }, tokenName))) }) })] }));
}
