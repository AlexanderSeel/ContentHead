import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useId } from 'react';
import { Button } from 'primereact/button';
import { Tooltip } from 'primereact/tooltip';
export function HelpIcon({ tooltip, onClick }) {
    const id = useId().replace(/:/g, '_');
    return (_jsxs(_Fragment, { children: [_jsx(Tooltip, { target: `#${id}`, content: tooltip, position: "top" }), _jsx(Button, { id: id, text: true, rounded: true, icon: "pi pi-question-circle", "aria-label": "Help", onClick: onClick })] }));
}
