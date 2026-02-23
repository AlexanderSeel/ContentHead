import { PRIME_THEMES } from './themeList';

export function applyTheme(themeValue: string): void {
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

export function applyScale(scale: number): void {
  document.documentElement.style.fontSize = `${scale}px`;
}

export function readCssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
