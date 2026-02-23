import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from 'primereact/card';
import { useAdminContext } from '../../app/AdminContext';
import { PageHeader } from '../../components/common/PageHeader';
export function SiteOverviewPage() {
    const { siteId, marketCode, localeCode, sites } = useAdminContext();
    const site = sites.find((entry) => entry.id === siteId);
    return (_jsxs("div", { children: [_jsx(PageHeader, { title: "Site Overview", subtitle: "Current tenant context and defaults" }), _jsxs(Card, { children: [_jsxs("p", { children: ["Site: ", site?.name ?? `#${siteId}`] }), _jsxs("p", { children: ["Current market: ", marketCode] }), _jsxs("p", { children: ["Current locale: ", localeCode] })] })] }));
}
