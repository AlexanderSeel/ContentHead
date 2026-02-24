import { PRIME_THEMES } from './themeList';

function applyThemeHref(link: HTMLLinkElement, candidates: string[]): void {
  if (candidates.length === 0) {
    return;
  }
  let index = 0;
  const tryLoad = () => {
    const href = candidates[index];
    if (!href) {
      return;
    }
    link.href = href;
    link.onerror = () => {
      index += 1;
      if (index < candidates.length) {
        tryLoad();
      }
    };
  };
  tryLoad();
}

export function applyTheme(themeValue: string): { theme: string; mode: 'light' | 'dark' } {
  const selected = PRIME_THEMES.find((entry) => entry.value === themeValue) ?? PRIME_THEMES[0]!;
  let link = document.getElementById('prime-theme') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.id = 'prime-theme';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
  const targetHref = selected.href[0];
  if (!targetHref) {
    return { theme: selected.value, mode: selected.mode };
  }
  if (!link.href.endsWith(targetHref)) {
    applyThemeHref(link, selected.href);
  }
  document.documentElement.dataset.primeTheme = selected.value;
  document.documentElement.dataset.primeThemeMode = selected.mode;
  return { theme: selected.value, mode: selected.mode };
}

export function applyScale(scale: number): void {
  document.documentElement.style.fontSize = `${scale}px`;
}

export function readCssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
