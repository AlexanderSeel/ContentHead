import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from 'primereact/card';
import { useAdminContext } from '../app/AdminContext';
import { PageHeader } from '../components/common/PageHeader';
export function DashboardPage() {
    const { siteId, marketCode, localeCode, combos } = useAdminContext();
    return (_jsxs("div", { children: [_jsx(PageHeader, { title: "Dashboard", subtitle: "ContentHead Studio backend overview" }), _jsxs("div", { className: "card-grid", children: [_jsxs(Card, { title: "Active Context", children: [_jsxs("p", { children: ["Site: ", siteId] }), _jsxs("p", { children: ["Market/Locale: ", marketCode, "/", localeCode] }), _jsxs("p", { children: ["Active combinations: ", combos.filter((entry) => entry.active).length] })] }), _jsx(Card, { title: "Quick Links", children: _jsx("p", { children: "Use sidebar to navigate to Pages, Matrix, Workflows, and Dev Tools." }) })] })] }));
}
