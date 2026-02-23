import { createContext, useContext, useMemo, useState } from 'react';

import { createAdminSdk } from '../lib/sdk';

type AuthContextValue = {
  token: string | null;
  username: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
};

const TOKEN_KEY = 'contenthead.admin.token';
const USER_KEY = 'contenthead.admin.username';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [username, setUsername] = useState<string | null>(() => localStorage.getItem(USER_KEY));

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      username,
      isAuthenticated: Boolean(token),
      login: async (user: string, password: string) => {
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
    }),
    [token, username]
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
