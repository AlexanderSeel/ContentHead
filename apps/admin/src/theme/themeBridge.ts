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

function clampChannel(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function channelToHex(value: number): string {
  return clampChannel(value).toString(16).padStart(2, '0');
}

function toHexColor(r: number, g: number, b: number): string {
  return `#${channelToHex(r)}${channelToHex(g)}${channelToHex(b)}`;
}

function parseRgbColor(value: string): { r: number; g: number; b: number; a: number } | null {
  const match = value.trim().match(/^rgba?\(\s*([0-9.]+)\s*[, ]\s*([0-9.]+)\s*[, ]\s*([0-9.]+)(?:\s*[,/]\s*([0-9.]+))?\s*\)$/i);
  if (!match) {
    return null;
  }
  const r = Number.parseFloat(match[1] ?? '');
  const g = Number.parseFloat(match[2] ?? '');
  const b = Number.parseFloat(match[3] ?? '');
  const a = match[4] !== undefined ? Number.parseFloat(match[4]) : 1;
  if ([r, g, b, a].some((entry) => Number.isNaN(entry))) {
    return null;
  }
  return { r, g, b, a: Math.max(0, Math.min(1, a)) };
}

function sanitizeMonacoColor(input: string, fallback: string, blendBase?: string): string {
  const normalized = input.trim();
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(normalized)) {
    return normalized;
  }
  const rgb = parseRgbColor(normalized);
  if (!rgb) {
    return fallback;
  }
  if (rgb.a >= 1) {
    return toHexColor(rgb.r, rgb.g, rgb.b);
  }
  const base = parseRgbColor(blendBase ?? '') ?? { r: 255, g: 255, b: 255, a: 1 };
  const r = rgb.r * rgb.a + base.r * (1 - rgb.a);
  const g = rgb.g * rgb.a + base.g * (1 - rgb.a);
  const b = rgb.b * rgb.a + base.b * (1 - rgb.a);
  return toHexColor(r, g, b);
}

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
  const panel = sanitizeMonacoColor(snapshot.panel, '#ffffff');
  const surface = sanitizeMonacoColor(snapshot.surface, '#f8f9fa', panel);
  const text = sanitizeMonacoColor(snapshot.text, '#1f2937', panel);
  const mutedText = sanitizeMonacoColor(snapshot.mutedText, '#6b7280', panel);
  const border = sanitizeMonacoColor(snapshot.border, '#d1d5db', panel);
  monaco.editor.defineTheme(MONACO_THEME_ID, {
    base: snapshot.mode === 'dark' ? 'vs-dark' : 'vs',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': panel,
      'editor.foreground': text,
      'editor.lineHighlightBackground': 'transparent',
      'editorLineNumber.foreground': mutedText,
      'editorLineNumber.activeForeground': text,
      'editorWidget.background': surface,
      'editorWidget.border': border
    }
  });
  monaco.editor.setTheme(MONACO_THEME_ID);
  return snapshot;
}
