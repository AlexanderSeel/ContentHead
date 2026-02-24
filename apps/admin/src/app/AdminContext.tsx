import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { useAuth } from './AuthContext';
import { createAdminSdk } from '../lib/sdk';

export type Site = { id: number; name: string; active: boolean; urlPattern: string };
export type Combo = { siteId: number; marketCode: string; localeCode: string; active: boolean; isDefaultForMarket: boolean };

type AdminContextValue = {
  loading: boolean;
  error: string | null;
  sites: Site[];
  siteId: number;
  marketCode: string;
  localeCode: string;
  combos: Combo[];
  refreshContext: () => Promise<void>;
  setSiteId: (value: number) => void;
  setMarketCode: (value: string) => void;
  setLocaleCode: (value: string) => void;
};

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { token, isAuthenticated } = useAuth();
  const sdk = useMemo(() => createAdminSdk(token), [token]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [siteId, setSiteId] = useState(1);
  const [marketCode, setMarketCode] = useState('US');
  const [localeCode, setLocaleCode] = useState('en-US');
  const [combos, setCombos] = useState<Combo[]>([]);

  const refreshContext = async () => {
    if (!isAuthenticated) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const sitesResult = await sdk.safe.listSites();
      if (!sitesResult.ok) {
        setError(sitesResult.error.message);
        return;
      }
      const sitesRes = sitesResult.data;
      const nextSites = (sitesRes.listSites ?? []) as Site[];
      setSites(nextSites);
      const effectiveSiteId = nextSites.find((entry) => entry.id === siteId)?.id ?? nextSites[0]?.id ?? 1;
      if (effectiveSiteId !== siteId) {
        setSiteId(effectiveSiteId);
      }

      const matrixResult = await sdk.safe.getSiteMarketLocaleMatrix({ siteId: effectiveSiteId });
      if (!matrixResult.ok) {
        setError(matrixResult.error.message);
        return;
      }
      const matrix = matrixResult.data;
      const matrixValue = matrix.getSiteMarketLocaleMatrix;
      const nextCombos = (matrixValue?.combinations ?? []) as Combo[];
      setCombos(nextCombos);

      const defaultMarket = matrixValue?.defaults?.defaultMarketCode ?? nextCombos[0]?.marketCode ?? 'US';
      const localesByMarket = nextCombos.filter((entry) => entry.active && entry.marketCode === defaultMarket);
      const defaultLocale =
        matrixValue?.defaults?.defaultLocaleCode ??
        localesByMarket[0]?.localeCode ??
        nextCombos[0]?.localeCode ??
        'en-US';

      setMarketCode(defaultMarket);
      setLocaleCode(defaultLocale);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshContext().catch(() => undefined);
  }, [isAuthenticated, token]);

  const value = useMemo<AdminContextValue>(
    () => ({
      loading,
      error,
      sites,
      siteId,
      marketCode,
      localeCode,
      combos,
      refreshContext,
      setSiteId,
      setMarketCode,
      setLocaleCode
    }),
    [loading, error, sites, siteId, marketCode, localeCode, combos]
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdminContext() {
  const ctx = useContext(AdminContext);
  if (!ctx) {
    throw new Error('useAdminContext must be used inside AdminProvider');
  }
  return ctx;
}
