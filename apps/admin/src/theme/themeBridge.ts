import type * as Monaco from 'monaco-editor';

import { readCssVar } from './themeManager';
import { PRIME_THEMES } from './themeList';

export type ThemeBridgeSnapshot = {
  theme: string;
  mode: 'light' | 'dark';
  monacoTheme: string;
  surface: string;
  panel: string;
  text: string;
  mutedText: string;
  border: string;
};

const MONACO_THEME_ID = 'contenthead-prime';

export function resolveThemeMode(theme: string): 'light' | 'dark' {
  return PRIME_THEMES.find((entry) => entry.value === theme)?.mode ?? 'light';
}

export function createThemeBridgeSnapshot(theme: string): ThemeBridgeSnapshot {
  const mode = resolveThemeMode(theme);
  return {
    theme,
    mode,
    monacoTheme: MONACO_THEME_ID,
    surface: readCssVar('--surface-ground') || '#f8f9fa',
    panel: readCssVar('--surface-card') || '#ffffff',
    text: readCssVar('--text-color') || '#1f2937',
    mutedText: readCssVar('--text-color-secondary') || '#6b7280',
    border: readCssVar('--surface-border') || '#d1d5db'
  };
}

export function applyMonacoTheme(theme: string, monaco?: typeof Monaco): ThemeBridgeSnapshot {
  const snapshot = createThemeBridgeSnapshot(theme);
  if (!monaco) {
    return snapshot;
  }
  monaco.editor.defineTheme(MONACO_THEME_ID, {
    base: snapshot.mode === 'dark' ? 'vs-dark' : 'vs',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': snapshot.panel,
      'editor.foreground': snapshot.text,
      'editor.lineHighlightBackground': 'transparent',
      'editorLineNumber.foreground': snapshot.mutedText,
      'editorLineNumber.activeForeground': snapshot.text,
      'editorWidget.background': snapshot.surface,
      'editorWidget.border': snapshot.border
    }
  });
  monaco.editor.setTheme(MONACO_THEME_ID);
  return snapshot;
}
