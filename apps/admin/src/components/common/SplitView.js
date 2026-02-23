import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Splitter, SplitterPanel } from 'primereact/splitter';
export function SplitView({ left, right, leftSize = 30, rightSize = 70 }) {
    return (_jsxs(Splitter, { className: "split-view", children: [_jsx(SplitterPanel, { size: leftSize, minSize: 20, children: _jsx("div", { className: "split-pane", children: left }) }), _jsx(SplitterPanel, { size: rightSize, minSize: 30, children: _jsx("div", { className: "split-pane", children: right }) })] }));
}
