import { PRIME_THEMES } from './themeList';

export function applyTheme(themeValue: string): { theme: string; mode: 'light' | 'dark' } {
  const selected = PRIME_THEMES.find((entry) => entry.value === themeValue) ?? PRIME_THEMES[0]!;
  document.documentElement.dataset.theme = selected.mode;
  return { theme: selected.value, mode: selected.mode };
}

export function applyScale(scale: number): void {
  document.documentElement.style.fontSize = `${scale}px`;
}

export function readCssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
