import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../app/AuthContext';
export function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [username, setUsername] = useState('admin');
    const [password, setPassword] = useState('admin123!');
    const [error, setError] = useState('');
    const from = location.state?.from ?? '/';
    return (_jsx("main", { className: "centered-page", children: _jsxs(Card, { title: "ContentHead Studio Login", subTitle: "Sign in to the admin backend", children: [_jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Username" }), _jsx(InputText, { value: username, onChange: (event) => setUsername(event.target.value) })] }), _jsxs("div", { className: "form-row", children: [_jsx("label", { children: "Password" }), _jsx(Password, { value: password, feedback: false, toggleMask: true, onChange: (event) => setPassword(event.target.value) })] }), error ? _jsx("p", { className: "error-text", children: error }) : null, _jsx(Button, { label: "Login", onClick: () => login(username, password)
                        .then((ok) => {
                        if (ok) {
                            navigate(from, { replace: true });
                        }
                        else {
                            setError('Invalid username or password');
                        }
                    })
                        .catch((err) => setError(String(err))) })] }) }));
}
