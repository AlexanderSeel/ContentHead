import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../app/AuthContext';
import { createAdminSdk } from '../lib/sdk';
export function LoginPage() {
    const { login } = useAuth();
    const sdk = useMemo(() => createAdminSdk(null), []);
    const navigate = useNavigate();
    const location = useLocation();
    const [username, setUsername] = useState('admin');
    const [password, setPassword] = useState('admin123!');
    const [error, setError] = useState('');
    const [externalProviders, setExternalProviders] = useState([]);
    const from = location.state?.from ?? '/';
    useEffect(() => {
        sdk
            .listConnectors({ domain: 'auth' })
            .then((res) => setExternalProviders((res.listConnectors ?? [])
            .filter((entry) => entry.enabled && entry.type !== 'internal')
            .filter((entry) => typeof entry.id === 'number' && typeof entry.name === 'string' && typeof entry.type === 'string')
            .map((entry) => ({ id: entry.id, name: entry.name, type: entry.type }))))
            .catch(() => setExternalProviders([]));
    }, [sdk]);
    return (_jsx("main", { className: "centered-page", children: _jsxs(Card, { title: "ContentHead Studio Login", subTitle: "Sign in to the admin backend", children: [_jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Username" }), _jsx(InputText, { value: username, onChange: (event) => setUsername(event.target.value) })] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Password" }), _jsx(Password, { value: password, feedback: false, toggleMask: true, onChange: (event) => setPassword(event.target.value) })] }), error ? _jsx("p", { className: "error-text", children: error }) : null, _jsx(Button, { label: "Login", onClick: () => login(username, password)
                        .then((ok) => {
                        if (ok) {
                            navigate(from, { replace: true });
                        }
                        else {
                            setError('Invalid username or password');
                        }
                    })
                        .catch((err) => setError(String(err))) }), externalProviders.length > 0 ? (_jsxs("div", { className: "form-row", style: { marginTop: '0.75rem' }, children: [_jsx("label", { children: "External providers" }), _jsx("div", { className: "inline-actions", children: externalProviders.map((provider) => (_jsx(Button, { text: true, label: `Continue with ${provider.name}`, onClick: () => setError(`${provider.type} connector is configured. External login flow is stubbed in this build.`) }, provider.id))) })] })) : null] }) }));
}
