import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { useNavigate } from 'react-router-dom';
export function AccessDeniedPage() {
    const navigate = useNavigate();
    return (_jsx("main", { className: "centered-page", children: _jsxs(Card, { title: "Access Denied", children: [_jsx("p", { children: "You are not allowed to view this section." }), _jsx(Button, { label: "Go to Dashboard", onClick: () => navigate('/') })] }) }));
}
