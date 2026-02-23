import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { Card } from 'primereact/card';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { buildLocalizedPath, validateUrlPattern } from '@contenthead/shared';
import { useAdminContext } from '../../app/AdminContext';
import { PageHeader } from '../../components/common/PageHeader';
import { createAdminSdk } from '../../lib/sdk';
import { useAuth } from '../../app/AuthContext';
import { useUi } from '../../app/UiContext';
const URL_PATTERN_PRESETS = [
    { label: '/{market}/{locale}/...', value: '/{market}/{locale}' },
    { label: '/{market}-{locale}/...', value: '/{market}-{locale}' },
    { label: '/{locale}/{market}/...', value: '/{locale}/{market}' },
    { label: 'Custom', value: '__custom__' }
];
export function SiteOverviewPage() {
    const { token } = useAuth();
    const sdk = useMemo(() => createAdminSdk(token), [token]);
    const { siteId, marketCode, localeCode, sites, refreshContext } = useAdminContext();
    const { toast } = useUi();
    const site = sites.find((entry) => entry.id === siteId);
    const [customPattern, setCustomPattern] = useState(site?.urlPattern ?? '/{market}/{locale}');
    const [patternMode, setPatternMode] = useState(URL_PATTERN_PRESETS.find((entry) => entry.value === (site?.urlPattern ?? ''))?.value ?? '__custom__');
    useEffect(() => {
        if (!site) {
            return;
        }
        setCustomPattern(site.urlPattern);
        setPatternMode(URL_PATTERN_PRESETS.find((entry) => entry.value === site.urlPattern)?.value ?? '__custom__');
    }, [site?.id, site?.urlPattern]);
    const effectivePattern = patternMode === '__custom__' ? customPattern : patternMode;
    const validation = validateUrlPattern(effectivePattern);
    const preview = buildLocalizedPath(effectivePattern, marketCode.toLowerCase(), localeCode.toLowerCase(), 'start');
    return (_jsxs("div", { children: [_jsx(PageHeader, { title: "Site Overview", subtitle: "Current tenant context, defaults and URL rewriting." }), _jsxs(Card, { children: [_jsxs("div", { className: "form-grid", children: [_jsxs("div", { className: "status-panel", children: [_jsx("strong", { children: "Site" }), _jsx("div", { children: site?.name ?? `#${siteId}` })] }), _jsxs("div", { className: "status-panel", children: [_jsx("strong", { children: "Current Market" }), _jsx("div", { children: marketCode })] }), _jsxs("div", { className: "status-panel", children: [_jsx("strong", { children: "Current Locale" }), _jsx("div", { children: localeCode })] })] }), _jsx("h3", { children: "URL Pattern" }), _jsxs("div", { className: "form-grid", children: [_jsx(Dropdown, { value: patternMode, options: URL_PATTERN_PRESETS, onChange: (event) => {
                                    const value = String(event.value);
                                    setPatternMode(value);
                                    if (value !== '__custom__') {
                                        setCustomPattern(value);
                                    }
                                } }), _jsx(InputText, { value: customPattern, onChange: (event) => setCustomPattern(event.target.value), disabled: patternMode !== '__custom__', placeholder: "/{market}/{locale}" }), _jsx(Button, { label: "Save Pattern", disabled: !validation.valid, onClick: () => sdk
                                    .setSiteUrlPattern({
                                    siteId,
                                    urlPattern: effectivePattern
                                })
                                    .then(async () => {
                                    await refreshContext();
                                    toast({ severity: 'success', summary: 'Site URL pattern updated' });
                                }) })] }), !validation.valid ? _jsx("small", { className: "editor-error", children: validation.error }) : null, _jsxs("div", { className: "status-panel", children: ["Example preview: ", preview] })] })] }));
}
