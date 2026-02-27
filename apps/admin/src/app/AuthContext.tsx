import { createContext, useContext, useMemo, useState } from 'react';

import { createAdminSdk } from '../lib/sdk';

type AuthContextValue = {
  token: string | null;
  userId: string | null;
  username: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
};

const TOKEN_KEY = 'contenthead.admin.token';
const USER_ID_KEY = 'contenthead.admin.userId';
const USER_KEY = 'contenthead.admin.username';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [userId, setUserId] = useState<string | null>(() => {
    const fromStorage = localStorage.getItem(USER_ID_KEY);
    if (fromStorage) {
      return fromStorage;
    }
    return token ? extractUserIdFromToken(token) : null;
  });
  const [username, setUsername] = useState<string | null>(() => localStorage.getItem(USER_KEY));

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      userId,
      username,
      isAuthenticated: Boolean(token),
      login: async (user: string, password: string) => {
        const sdk = createAdminSdk(null);
        const result = await sdk.login({ username: user, password });
        const nextToken = result.login?.token ?? null;
        if (!nextToken) {
          return false;
        }

        const nextUserId =
          result.login?.user?.id != null
            ? String(result.login.user.id)
            : extractUserIdFromToken(nextToken);

        setToken(nextToken);
        setUserId(nextUserId);
        setUsername(result.login?.user?.username ?? user);
        localStorage.setItem(TOKEN_KEY, nextToken);
        if (nextUserId) {
          localStorage.setItem(USER_ID_KEY, nextUserId);
        } else {
          localStorage.removeItem(USER_ID_KEY);
        }
        localStorage.setItem(USER_KEY, result.login?.user?.username ?? user);
        return true;
      },
      logout: () => {
        setToken(null);
        setUserId(null);
        setUsername(null);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_ID_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }),
    [token, userId, username]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}

function extractUserIdFromToken(token: string): string | null {
  try {
    const payload = decodeJwtPayload(token);
    if (!payload || typeof payload !== 'object') {
      return null;
    }
    const candidate =
      payload.sub ??
      payload.userId ??
      payload.user_id ??
      payload.uid ??
      payload.id;
    if (candidate == null) {
      return null;
    }
    const value = String(candidate).trim();
    return value.length > 0 ? value : null;
  } catch {
    return null;
  }
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  const base64 = parts[1]?.replace(/-/g, '+').replace(/_/g, '/');
  if (!base64) {
    return null;
  }
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  const decoded = atob(padded);
  const parsed = JSON.parse(decoded) as Record<string, unknown>;
  return parsed;
}
