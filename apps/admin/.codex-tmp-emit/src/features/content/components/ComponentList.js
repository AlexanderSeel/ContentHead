import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from 'primereact/button';
import { getComponentRegistryEntry } from './componentRegistry';
export function ComponentList({ areas, componentMap, selected, onSelect, onMove, onDuplicate, onDelete }) {
    return (_jsx("div", { className: "cms-component-list", children: areas.map((area) => (_jsxs("section", { className: "cms-area-block", children: [_jsxs("div", { className: "cms-area-header", children: [_jsx("strong", { children: area.name }), _jsxs("small", { children: [area.components.length, " components"] })] }), area.components.length === 0 ? _jsx("div", { className: "muted", children: "No components in this area." }) : null, area.components.map((id) => {
                    const component = componentMap[id];
                    const meta = getComponentRegistryEntry(component?.type ?? '');
                    const active = selected === id;
                    return (_jsxs("article", { className: `cms-component-card ${active ? 'selected' : ''}`, onClick: () => onSelect(id), role: "button", tabIndex: 0, onKeyDown: (event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                onSelect(id);
                            }
                        }, children: [_jsxs("div", { className: "cms-component-card-head", children: [_jsx("strong", { children: meta?.label ?? component?.type ?? 'Unknown' }), _jsx("small", { children: id })] }), _jsxs("div", { className: "inline-actions", children: [_jsx(Button, { text: true, size: "small", icon: "pi pi-angle-up", onClick: (event) => { event.stopPropagation(); onMove(id, -1); } }), _jsx(Button, { text: true, size: "small", icon: "pi pi-angle-down", onClick: (event) => { event.stopPropagation(); onMove(id, 1); } }), _jsx(Button, { text: true, size: "small", icon: "pi pi-copy", onClick: (event) => { event.stopPropagation(); onDuplicate(id); } }), _jsx(Button, { text: true, size: "small", severity: "danger", icon: "pi pi-trash", onClick: (event) => { event.stopPropagation(); onDelete(id); } })] })] }, id));
                })] }, area.name))) }));
}
