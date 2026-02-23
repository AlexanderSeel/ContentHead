import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useAdminContext } from '../../app/AdminContext';
import { PageHeader } from '../../components/common/PageHeader';
import { WorkflowDesignerSection } from '../WorkflowDesignerSection';
export function WorkflowDesignerPage() {
    const { siteId, marketCode, localeCode } = useAdminContext();
    const [status, setStatus] = useState('');
    return (_jsxs("div", { children: [_jsx(PageHeader, { title: "Workflow Designer", subtitle: "Design and configure workflow graphs" }), _jsx(WorkflowDesignerSection, { siteId: siteId, selectedItemId: null, selectedVariantSetId: null, market: marketCode, locale: localeCode, onStatus: setStatus }), status ? _jsx("pre", { children: status }) : null] }));
}
