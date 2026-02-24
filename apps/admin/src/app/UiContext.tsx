import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';
import type { ToastMessage } from 'primereact/toast';
import { PRIME_THEMES, type ThemeOption } from '../theme/themeList';
import { applyScale, applyTheme } from '../theme/themeManager';
import { createThemeBridgeSnapshot, type ThemeBridgeSnapshot } from '../theme/themeBridge';
import { setGraphqlErrorNotifier } from '../lib/graphqlReliability';

const THEME_STORAGE_KEY = 'contenthead.admin.theme';
const SCALE_STORAGE_KEY = 'contenthead.admin.scale';


type UiContextValue = {
  theme: string;
  themeMode: 'light' | 'dark';
  scale: number;
  themes: ThemeOption[];
  themeBridge: ThemeBridgeSnapshot;
  setTheme: (value: string) => void;
  setScale: (value: number) => void;
  toast: (message: ToastMessage) => void;
  confirm: (options: { header: string; message: string; acceptLabel?: string; rejectLabel?: string }) => Promise<boolean>;
};

const UiContext = createContext<UiContextValue | null>(null);

export function UiProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<string>(() => localStorage.getItem(THEME_STORAGE_KEY) ?? PRIME_THEMES[0]!.value);
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => createThemeBridgeSnapshot(theme).mode);
  const [scale, setScaleState] = useState<number>(() => Number(localStorage.getItem(SCALE_STORAGE_KEY) ?? '14'));
  const toastRef = useRef<Toast>(null);

  useEffect(() => {
    const applied = applyTheme(theme);
    setThemeMode(applied.mode);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const normalized = Number.isFinite(scale) ? Math.max(12, Math.min(16, scale)) : 14;
    applyScale(normalized);
    localStorage.setItem(SCALE_STORAGE_KEY, String(normalized));
  }, [scale]);

  useEffect(() => {
    setGraphqlErrorNotifier((failure) => {
      toastRef.current?.show({
        severity: 'error',
        summary: `${failure.operationName} failed`,
        detail: failure.message,
        life: 5000
      });
    });
    return () => setGraphqlErrorNotifier(null);
  }, []);

  const value = useMemo<UiContextValue>(
    () => ({
      theme,
      themeMode,
      scale,
      themes: PRIME_THEMES,
      themeBridge: createThemeBridgeSnapshot(theme),
      setTheme: setThemeState,
      setScale: setScaleState,
      toast: (message) => toastRef.current?.show(message),
      confirm: (options) =>
        new Promise((resolve) => {
          confirmDialog({
            header: options.header,
            message: options.message,
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: options.acceptLabel ?? 'Confirm',
            rejectLabel: options.rejectLabel ?? 'Cancel',
            accept: () => resolve(true),
            reject: () => resolve(false)
          });
        })
    }),
    [theme, themeMode, scale]
  );

  return (
    <UiContext.Provider value={value}>
      <Toast ref={toastRef} />
      <ConfirmDialog />
      {children}
    </UiContext.Provider>
  );
}

export function useUi() {
  const context = useContext(UiContext);
  if (!context) {
    throw new Error('useUi must be used within UiProvider');
  }
  return context;
}
