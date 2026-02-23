import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';
import type { ToastMessage } from 'primereact/toast';

type ThemeOption = {
  label: string;
  value: string;
  href: string;
};

const THEME_STORAGE_KEY = 'contenthead.admin.theme';
const SCALE_STORAGE_KEY = 'contenthead.admin.scale';

const THEME_BASE = 'https://unpkg.com/primereact@10.9.2/resources/themes';

export const PRIME_THEMES: ThemeOption[] = [
  { label: 'Lara Light Blue', value: 'lara-light-blue', href: `${THEME_BASE}/lara-light-blue/theme.css` },
  { label: 'Lara Light Indigo', value: 'lara-light-indigo', href: `${THEME_BASE}/lara-light-indigo/theme.css` },
  { label: 'Lara Light Cyan', value: 'lara-light-cyan', href: `${THEME_BASE}/lara-light-cyan/theme.css` },
  { label: 'Lara Light Green', value: 'lara-light-green', href: `${THEME_BASE}/lara-light-green/theme.css` },
  { label: 'Lara Light Amber', value: 'lara-light-amber', href: `${THEME_BASE}/lara-light-amber/theme.css` },
  { label: 'Lara Dark Blue', value: 'lara-dark-blue', href: `${THEME_BASE}/lara-dark-blue/theme.css` },
  { label: 'Lara Dark Indigo', value: 'lara-dark-indigo', href: `${THEME_BASE}/lara-dark-indigo/theme.css` },
  { label: 'Lara Dark Teal', value: 'lara-dark-teal', href: `${THEME_BASE}/lara-dark-teal/theme.css` },
  { label: 'Soho Light', value: 'soho-light', href: `${THEME_BASE}/soho-light/theme.css` },
  { label: 'Soho Dark', value: 'soho-dark', href: `${THEME_BASE}/soho-dark/theme.css` }
];

type UiContextValue = {
  theme: string;
  scale: number;
  themes: ThemeOption[];
  setTheme: (value: string) => void;
  setScale: (value: number) => void;
  toast: (message: ToastMessage) => void;
  confirm: (options: { header: string; message: string; acceptLabel?: string; rejectLabel?: string }) => Promise<boolean>;
};

const UiContext = createContext<UiContextValue | null>(null);

function applyTheme(themeValue: string): void {
  const selected = PRIME_THEMES.find((entry) => entry.value === themeValue) ?? PRIME_THEMES[0]!;
  let link = document.getElementById('prime-theme') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.id = 'prime-theme';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
  if (link.href !== selected.href) {
    link.href = selected.href;
  }
}

function applyScale(scale: number): void {
  document.documentElement.style.fontSize = `${scale}px`;
}

export function UiProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<string>(() => localStorage.getItem(THEME_STORAGE_KEY) ?? PRIME_THEMES[0]!.value);
  const [scale, setScaleState] = useState<number>(() => Number(localStorage.getItem(SCALE_STORAGE_KEY) ?? '14'));
  const toastRef = useRef<Toast>(null);

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const normalized = Number.isFinite(scale) ? Math.max(12, Math.min(16, scale)) : 14;
    applyScale(normalized);
    localStorage.setItem(SCALE_STORAGE_KEY, String(normalized));
  }, [scale]);

  const value = useMemo<UiContextValue>(
    () => ({
      theme,
      scale,
      themes: PRIME_THEMES,
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
    [theme, scale]
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
