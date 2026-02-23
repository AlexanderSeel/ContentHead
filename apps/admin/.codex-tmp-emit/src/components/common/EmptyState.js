import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
export function EmptyState({ title, description, actionLabel, onAction }) {
    return (_jsxs(Card, { className: "empty-state", children: [_jsx("h3", { children: title }), _jsx("p", { children: description }), actionLabel ? _jsx(Button, { label: actionLabel, onClick: onAction }) : null] }));
}
