import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BreadCrumb } from 'primereact/breadcrumb';
import { Dropdown } from 'primereact/dropdown';
import { Menu } from 'primereact/menu';
import { Button } from 'primereact/button';
import { useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { breadcrumbItems } from './routeMeta';
import { useAdminContext } from '../app/AdminContext';
import { useAuth } from '../app/AuthContext';
export function Topbar() {
    const location = useLocation();
    const { username, logout } = useAuth();
    const { sites, siteId, setSiteId, combos, marketCode, localeCode, setMarketCode, setLocaleCode } = useAdminContext();
    const userMenuRef = useRef(null);
    const breadcrumbModel = useMemo(() => breadcrumbItems(location.pathname), [location.pathname]);
    const marketOptions = useMemo(() => Array.from(new Set(combos.filter((entry) => entry.active).map((entry) => entry.marketCode))), [combos]);
    const localeOptions = useMemo(() => Array.from(new Set(combos.filter((entry) => entry.active && entry.marketCode === marketCode).map((entry) => entry.localeCode))), [combos, marketCode]);
    return (_jsxs("header", { className: "admin-topbar", children: [_jsx("div", { className: "topbar-brand", children: "ContentHead Studio" }), _jsx(BreadCrumb, { model: breadcrumbModel, home: { icon: 'pi pi-home' } }), _jsxs("div", { className: "topbar-controls", children: [_jsx(Dropdown, { value: siteId, options: sites.map((entry) => ({ label: `${entry.id}: ${entry.name}`, value: entry.id })), onChange: (event) => setSiteId(Number(event.value)), placeholder: "Site" }), _jsx(Dropdown, { value: marketCode, options: marketOptions.map((entry) => ({ label: entry, value: entry })), onChange: (event) => setMarketCode(String(event.value)), placeholder: "Market" }), _jsx(Dropdown, { value: localeCode, options: localeOptions.map((entry) => ({ label: entry, value: entry })), onChange: (event) => setLocaleCode(String(event.value)), placeholder: "Locale" }), _jsx(Menu, { popup: true, ref: userMenuRef, model: [
                            { label: username ?? 'User', disabled: true },
                            { label: 'Logout', icon: 'pi pi-sign-out', command: logout }
                        ] }), _jsx(Button, { label: username ?? 'Account', icon: "pi pi-user", onClick: (event) => userMenuRef.current?.toggle(event) })] })] }));
}
