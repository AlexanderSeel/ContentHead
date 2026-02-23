import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { useNavigate } from 'react-router-dom';
export function NotFoundPage() {
    const navigate = useNavigate();
    return (_jsx("main", { className: "centered-page", children: _jsxs(Card, { title: "Not Found", children: [_jsx("p", { children: "The requested page does not exist." }), _jsx(Button, { label: "Go to Dashboard", onClick: () => navigate('/') })] }) }));
}
