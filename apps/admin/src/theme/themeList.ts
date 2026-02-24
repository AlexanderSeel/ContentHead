export type ThemeOption = {
  label: string;
  value: string;
  href: string[];
  mode: 'light' | 'dark';
};

const CDN_THEME_BASE = 'https://unpkg.com/primereact@10.9.7/resources/themes';

const THEME_VALUES = [
  'arya-blue',
  'arya-green',
  'arya-orange',
  'arya-purple',
  'bootstrap4-dark-blue',
  'bootstrap4-dark-purple',
  'bootstrap4-light-blue',
  'bootstrap4-light-purple',
  'fluent-light',
  'lara-dark-amber',
  'lara-dark-blue',
  'lara-dark-cyan',
  'lara-dark-green',
  'lara-dark-indigo',
  'lara-dark-pink',
  'lara-dark-purple',
  'lara-dark-teal',
  'lara-light-amber',
  'lara-light-blue',
  'lara-light-cyan',
  'lara-light-green',
  'lara-light-indigo',
  'lara-light-pink',
  'lara-light-purple',
  'lara-light-teal',
  'luna-amber',
  'luna-blue',
  'luna-green',
  'luna-pink',
  'md-dark-deeppurple',
  'md-dark-indigo',
  'md-light-deeppurple',
  'md-light-indigo',
  'mdc-dark-deeppurple',
  'mdc-dark-indigo',
  'mdc-light-deeppurple',
  'mdc-light-indigo',
  'mira',
  'nano',
  'nova',
  'nova-accent',
  'nova-alt',
  'rhea',
  'saga-blue',
  'saga-green',
  'saga-orange',
  'saga-purple',
  'soho-dark',
  'soho-light',
  'tailwind-light',
  'vela-blue',
  'vela-green',
  'vela-orange',
  'vela-purple',
  'viva-dark',
  'viva-light'
] as const;

function toThemeLabel(value: string): string {
  return value
    .split('-')
    .map((entry) => {
      if (entry === 'md' || entry === 'mdc') {
        return entry.toUpperCase();
      }
      return entry.charAt(0).toUpperCase() + entry.slice(1);
    })
    .join(' ');
}

function resolveThemeMode(value: string): 'light' | 'dark' {
  if (value.includes('dark') || value.startsWith('arya') || value.startsWith('luna') || value.startsWith('vela')) {
    return 'dark';
  }
  return 'light';
}

export const PRIME_THEMES: ThemeOption[] = THEME_VALUES.map((value) => ({
  label: toThemeLabel(value),
  value,
  mode: resolveThemeMode(value),
  href: [`/themes/${value}/theme.css`, `${CDN_THEME_BASE}/${value}/theme.css`]
}));
