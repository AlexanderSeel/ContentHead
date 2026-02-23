export type ThemeOption = {
  label: string;
  value: string;
  href: string;
};

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
