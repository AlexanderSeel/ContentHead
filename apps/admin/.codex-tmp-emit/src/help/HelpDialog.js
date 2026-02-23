import { jsx as _jsx } from "react/jsx-runtime";
import { Dialog } from 'primereact/dialog';
import { helpContent } from './helpContent';
function renderMarkdown(input) {
    return input
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br/>');
}
export function HelpDialog({ topicKey, visible, onHide }) {
    const topic = topicKey ? helpContent[topicKey] : null;
    return (_jsx(Dialog, { header: topic?.title ?? 'Help', visible: visible, onHide: onHide, style: { width: '34rem' }, children: _jsx("div", { dangerouslySetInnerHTML: { __html: renderMarkdown(topic?.markdown ?? 'No help topic found.') } }) }));
}
