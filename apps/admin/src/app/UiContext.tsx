import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';
import type { ToastMessage } from 'primereact/toast';
import { PRIME_THEMES, type ThemeOption } from '../theme/themeList';
import { applyScale, applyTheme } from '../theme/themeManager';
import { createThemeBridgeSnapshot, type ThemeBridgeSnapshot } from '../theme/themeBridge';
import { setGraphqlErrorNotifier } from '../lib/graphqlReliability';
import { registerToastDispatcher, showError, showToast } from '../ui/toast';

const THEME_STORAGE_KEY = 'contenthead.admin.theme';
const SCALE_STORAGE_KEY = 'contenthead.admin.scale';
const LAYOUT_PREFS_STORAGE_KEY = 'contenthead.admin.layout.preferences';

export type LayoutPreferences = {
  density: 'comfortable' | 'compact';
  showWorkspacePanel: boolean;
};


type UiContextValue = {
  theme: string;
  themeMode: 'light' | 'dark';
  scale: number;
  themes: ThemeOption[];
  themeBridge: ThemeBridgeSnapshot;
  setTheme: (value: string) => void;
  setScale: (value: number) => void;
  layoutPreferences: LayoutPreferences;
  setLayoutPreferences: (value: Partial<LayoutPreferences>) => void;
  toast: (message: ToastMessage, featureTag?: string) => void;
  confirm: (options: { header: string; message: string; acceptLabel?: string; rejectLabel?: string }) => Promise<boolean>;
};

const UiContext = createContext<UiContextValue | null>(null);

export function UiProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<string>(() => localStorage.getItem(THEME_STORAGE_KEY) ?? PRIME_THEMES[0]!.value);
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => createThemeBridgeSnapshot(theme).mode);
  const [scale, setScaleState] = useState<number>(() => Number(localStorage.getItem(SCALE_STORAGE_KEY) ?? '14'));
  const [layoutPreferences, setLayoutPreferencesState] = useState<LayoutPreferences>(() => {
    const raw = localStorage.getItem(LAYOUT_PREFS_STORAGE_KEY);
    if (!raw) {
      return { density: 'comfortable', showWorkspacePanel: true };
    }
    try {
      const parsed = JSON.parse(raw) as Partial<LayoutPreferences>;
      return {
        density: parsed.density === 'compact' ? 'compact' : 'comfortable',
        showWorkspacePanel: parsed.showWorkspacePanel !== false
      };
    } catch {
      return { density: 'comfortable', showWorkspacePanel: true };
    }
  });
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
    document.body.dataset.chDensity = layoutPreferences.density;
    localStorage.setItem(LAYOUT_PREFS_STORAGE_KEY, JSON.stringify(layoutPreferences));
  }, [layoutPreferences]);

  useEffect(() => {
    registerToastDispatcher((message) => {
      toastRef.current?.show(message);
    });
    return () => registerToastDispatcher(null);
  }, []);

  useEffect(() => {
    setGraphqlErrorNotifier((failure) => {
      showError({
        summary: `${failure.operationName} failed`,
        detail: failure.message,
        life: 5000,
        featureTag: 'graphql'
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
      layoutPreferences,
      setLayoutPreferences: (next) =>
        setLayoutPreferencesState((current) => ({
          ...current,
          ...next
        })),
      toast: (message, featureTag) => showToast(message, featureTag),
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
    [theme, themeMode, scale, layoutPreferences]
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
