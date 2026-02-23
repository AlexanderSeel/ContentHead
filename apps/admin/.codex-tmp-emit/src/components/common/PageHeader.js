import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Toolbar } from 'primereact/toolbar';
import { useState } from 'react';
import { Button } from 'primereact/button';
import { AskAiDialog } from '../assist/AskAiDialog';
import { HelpDialog } from '../../help/HelpDialog';
import { helpContent } from '../../help/helpContent';
import { HelpIcon } from '../../help/HelpIcon';
export function PageHeader({ title, subtitle, actions, helpTopicKey, askAiContext, askAiPayload, onAskAiApply, onAskAiInsert }) {
    const [helpOpen, setHelpOpen] = useState(false);
    const [askAiOpen, setAskAiOpen] = useState(false);
    const topic = helpTopicKey ? helpContent[helpTopicKey] : undefined;
    const hasHelp = Boolean(topic);
    return (_jsxs(_Fragment, { children: [_jsx(Toolbar, { className: "page-header", start: _jsxs("div", { children: [_jsx("h2", { children: title }), subtitle ? _jsx("p", { children: subtitle }) : null] }), end: (_jsxs("div", { className: "page-header-actions", children: [hasHelp ? _jsx(HelpIcon, { tooltip: topic?.tooltip ?? '', onClick: () => setHelpOpen(true) }) : null, askAiContext ? _jsx(Button, { text: true, icon: "pi pi-sparkles", label: "Ask AI", onClick: () => setAskAiOpen(true) }) : null, actions] })) }), hasHelp ? _jsx(HelpDialog, { topicKey: helpTopicKey ?? null, visible: helpOpen, onHide: () => setHelpOpen(false) }) : null, askAiContext ? (_jsx(AskAiDialog, { visible: askAiOpen, onHide: () => setAskAiOpen(false), defaultContext: askAiContext, contextPayload: askAiPayload ?? {}, ...(onAskAiApply ? { onApply: onAskAiApply } : {}), ...(onAskAiInsert ? { onInsert: onAskAiInsert } : {}) })) : null] }));
}
