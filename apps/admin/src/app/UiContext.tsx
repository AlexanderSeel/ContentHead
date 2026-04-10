import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { PRIME_THEMES, type ThemeOption } from '../theme/themeList';
import { applyScale, applyTheme } from '../theme/themeManager';
import { createThemeBridgeSnapshot, type ThemeBridgeSnapshot } from '../theme/themeBridge';
import { setGraphqlErrorNotifier } from '../lib/graphqlReliability';
import { registerToastDispatcher, showError, showToast, type ToastOptions } from '../ui/toast';

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
  toast: (message: ToastOptions, featureTag?: string) => void;
  confirm: (options: { header: string; message: string; acceptLabel?: string; rejectLabel?: string }) => Promise<boolean>;
};

const UiContext = createContext<UiContextValue | null>(null);

// ─── Toast state ────────────────────────────────────────────────────────────

type ActiveToast = ToastOptions & { id: number };
let toastSeq = 0;

// ─── Confirm state ───────────────────────────────────────────────────────────

type ConfirmState = {
  open: boolean;
  header: string;
  message: string;
  acceptLabel: string;
  rejectLabel: string;
  resolve: (result: boolean) => void;
};

// ─── Provider ────────────────────────────────────────────────────────────────

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

  const [toasts, setToasts] = useState<ActiveToast[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const confirmResolveRef = useRef<((result: boolean) => void) | null>(null);

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
      setToasts((prev) => [...prev, { ...message, id: ++toastSeq }]);
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

  const confirm = useCallback(
    (options: { header: string; message: string; acceptLabel?: string; rejectLabel?: string }) =>
      new Promise<boolean>((resolve) => {
        confirmResolveRef.current = resolve;
        setConfirmState({
          open: true,
          header: options.header,
          message: options.message,
          acceptLabel: options.acceptLabel ?? 'Confirm',
          rejectLabel: options.rejectLabel ?? 'Cancel',
          resolve
        });
      }),
    []
  );

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
      confirm
    }),
    [theme, themeMode, scale, layoutPreferences, confirm]
  );

  const severityClass: Record<string, string> = {
    success: 'p-toast-message-success',
    info: 'p-toast-message-info',
    warn: 'p-toast-message-warn',
    error: 'p-toast-message-error'
  };

  const severityIcon: Record<string, string> = {
    success: 'pi-check-circle',
    info: 'pi-info-circle',
    warn: 'pi-exclamation-triangle',
    error: 'pi-times-circle'
  };

  return (
    <UiContext.Provider value={value}>
      <ToastPrimitive.Provider swipeDirection="right">
        {toasts.map((t) => (
          <ToastPrimitive.Root
            key={t.id}
            className={`p-toast-message p-component ${severityClass[t.severity ?? 'info'] ?? 'p-toast-message-info'}`}
            duration={t.life ?? 3000}
            onOpenChange={(open) => {
              if (!open) setToasts((prev) => prev.filter((x) => x.id !== t.id));
            }}
          >
            <div className="p-toast-message-content">
              <span className={`p-toast-message-icon pi ${severityIcon[t.severity ?? 'info'] ?? 'pi-info-circle'}`} />
              <div className="p-toast-message-text">
                <ToastPrimitive.Title className="p-toast-summary">{t.summary}</ToastPrimitive.Title>
                {t.detail && (
                  <ToastPrimitive.Description className="p-toast-detail">{t.detail}</ToastPrimitive.Description>
                )}
              </div>
              <ToastPrimitive.Close className="p-toast-icon-close p-link">
                <span className="p-toast-icon-close-icon pi pi-times" />
              </ToastPrimitive.Close>
            </div>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport className="p-toast p-toast-top-right p-component" />
      </ToastPrimitive.Provider>

      <AlertDialog.Root
        open={confirmState?.open ?? false}
        onOpenChange={(open) => {
          if (!open) {
            confirmResolveRef.current?.(false);
            setConfirmState(null);
          }
        }}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="p-dialog-mask p-component-overlay" style={{ position: 'fixed', inset: 0, zIndex: 1100 }} />
          <AlertDialog.Content
            className="p-dialog p-confirm-dialog p-component"
            style={{ position: 'fixed', zIndex: 1101 }}
          >
            <div className="p-dialog-header">
              <span className="p-dialog-title">{confirmState?.header}</span>
            </div>
            <div className="p-dialog-content">
              <i className="p-confirm-dialog-icon pi pi-exclamation-triangle" />
              <span className="p-confirm-dialog-message">{confirmState?.message}</span>
            </div>
            <div className="p-dialog-footer">
              <AlertDialog.Cancel asChild>
                <button
                  className="p-button p-component p-button-text"
                  type="button"
                  onClick={() => {
                    confirmResolveRef.current?.(false);
                    setConfirmState(null);
                  }}
                >
                  <span className="p-button-label">{confirmState?.rejectLabel ?? 'Cancel'}</span>
                </button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <button
                  className="p-button p-component"
                  type="button"
                  onClick={() => {
                    confirmResolveRef.current?.(true);
                    setConfirmState(null);
                  }}
                >
                  <span className="p-button-label">{confirmState?.acceptLabel ?? 'Confirm'}</span>
                </button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>

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
