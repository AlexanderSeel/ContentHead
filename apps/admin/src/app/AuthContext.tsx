import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { createAdminSdk } from '../lib/sdk';

type AuthContextValue = {
  authReady: boolean;
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
  const [authReady, setAuthReady] = useState<boolean>(() => localStorage.getItem(TOKEN_KEY) == null);
  const [userId, setUserId] = useState<string | null>(() => {
    const fromStorage = localStorage.getItem(USER_ID_KEY);
    if (fromStorage) {
      return fromStorage;
    }
    return token ? extractUserIdFromToken(token) : null;
  });
  const [username, setUsername] = useState<string | null>(() => localStorage.getItem(USER_KEY));

  const clearAuthState = useCallback(() => {
    setToken(null);
    setUserId(null);
    setUsername(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  useEffect(() => {
    let active = true;

    if (!token) {
      setAuthReady(true);
      return () => {
        active = false;
      };
    }

    setAuthReady(false);
    const sdk = createAdminSdk(token);

    void sdk.safe
      .me()
      .then((result) => {
        if (!active) {
          return;
        }

        const me = result.ok ? result.data.me : null;
        if (!me?.id || !me.username) {
          clearAuthState();
          setAuthReady(true);
          return;
        }

        const nextUserId = String(me.id);
        setUserId(nextUserId);
        setUsername(me.username);
        localStorage.setItem(USER_ID_KEY, nextUserId);
        localStorage.setItem(USER_KEY, me.username);
        setAuthReady(true);
      })
      .catch(() => {
        if (!active) {
          return;
        }
        clearAuthState();
        setAuthReady(true);
      });

    return () => {
      active = false;
    };
  }, [token, clearAuthState]);

  const value = useMemo<AuthContextValue>(
    () => ({
      authReady,
      token,
      userId,
      username,
      isAuthenticated: authReady && Boolean(token),
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
        setAuthReady(true);
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
        clearAuthState();
        setAuthReady(true);
      }
    }),
    [authReady, token, userId, username, clearAuthState]
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
