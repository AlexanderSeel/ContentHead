import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useMemo, useState } from 'react';
import { createAdminSdk } from '../lib/sdk';
const TOKEN_KEY = 'contenthead.admin.token';
const USER_KEY = 'contenthead.admin.username';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
    const [username, setUsername] = useState(() => localStorage.getItem(USER_KEY));
    const value = useMemo(() => ({
        token,
        username,
        isAuthenticated: Boolean(token),
        login: async (user, password) => {
            const sdk = createAdminSdk(null);
            const result = await sdk.login({ username: user, password });
            const nextToken = result.login?.token ?? null;
            if (!nextToken) {
                return false;
            }
            setToken(nextToken);
            setUsername(result.login?.user?.username ?? user);
            localStorage.setItem(TOKEN_KEY, nextToken);
            localStorage.setItem(USER_KEY, result.login?.user?.username ?? user);
            return true;
        },
        logout: () => {
            setToken(null);
            setUsername(null);
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
        }
    }), [token, username]);
    return _jsx(AuthContext.Provider, { value: value, children: children });
}
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth must be used inside AuthProvider');
    }
    return ctx;
}
