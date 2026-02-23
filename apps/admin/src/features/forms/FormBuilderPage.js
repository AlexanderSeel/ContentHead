import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useAdminContext } from '../../app/AdminContext';
import { PageHeader } from '../../components/common/PageHeader';
import { FormBuilderSection } from '../FormBuilderSection';
export function FormBuilderPage() {
    const { siteId } = useAdminContext();
    const [status, setStatus] = useState('');
    return (_jsxs("div", { children: [_jsx(PageHeader, { title: "Form Builder", subtitle: "Steps, fields and conditional rules" }), _jsx(FormBuilderSection, { siteId: siteId, onStatus: setStatus }), status ? _jsx("pre", { children: status }) : null] }));
}
