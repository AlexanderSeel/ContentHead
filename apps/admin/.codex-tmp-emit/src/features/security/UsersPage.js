import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from 'primereact/card';
import { PageHeader } from '../../components/common/PageHeader';
export function UsersPage() {
    return (_jsxs("div", { children: [_jsx(PageHeader, { title: "Users", subtitle: "Security management" }), _jsx(Card, { children: _jsx("p", { children: "User management UI placeholder. Authentication currently uses InternalAuthProvider seeded admin user." }) })] }));
}
