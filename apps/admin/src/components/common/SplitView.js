import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Splitter, SplitterPanel } from 'primereact/splitter';
export function SplitView({ left, right, leftSize = 30, rightSize = 70 }) {
    return (_jsxs(Splitter, { style: { height: 'calc(100vh - 220px)' }, children: [_jsx(SplitterPanel, { size: leftSize, minSize: 20, children: left }), _jsx(SplitterPanel, { size: rightSize, minSize: 30, children: right })] }));
}
