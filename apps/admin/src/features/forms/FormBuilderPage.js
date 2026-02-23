import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAdminContext } from '../../app/AdminContext';
import { PageHeader } from '../../components/common/PageHeader';
import { FormBuilderSection } from '../FormBuilderSection';
export function FormBuilderPage() {
    const { siteId } = useAdminContext();
    const { formId } = useParams();
    const [status, setStatus] = useState('');
    const initialFormId = formId ? Number(formId) : null;
    return (_jsxs("div", { className: "pageRoot", children: [_jsx(PageHeader, { title: "Form Builder", subtitle: "Steps, fields and conditional rules", helpTopicKey: "forms", askAiContext: "forms", askAiPayload: { siteId } }), _jsx(FormBuilderSection, { siteId: siteId, initialFormId: Number.isFinite(initialFormId) ? initialFormId : null, onStatus: setStatus }), status ? _jsx("pre", { children: status }) : null] }));
}
