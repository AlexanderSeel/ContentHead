import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
export function AdminShell() {
    return (_jsxs("main", { className: "admin-layout", children: [_jsx(Sidebar, { showDevTools: import.meta.env.DEV }), _jsxs("section", { className: "admin-main", children: [_jsx(Topbar, {}), _jsx("div", { className: "admin-content", children: _jsx(Outlet, {}) })] })] }));
}
