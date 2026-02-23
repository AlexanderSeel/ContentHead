import { jsx as _jsx } from "react/jsx-runtime";
import { Navigate, Outlet } from 'react-router-dom';
export function DevGuard() {
    if (!import.meta.env.DEV) {
        return _jsx(Navigate, { to: "/access-denied", replace: true });
    }
    return _jsx(Outlet, {});
}
