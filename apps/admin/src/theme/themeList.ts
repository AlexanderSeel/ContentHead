export type ThemeOption = {
  label: string;
  value: string;
  href: string;
  mode: 'light' | 'dark';
};

const PRIMEREACT_CDN = 'https://unpkg.com/primereact@10.9.2/resources/themes';

export const PRIME_THEMES: ThemeOption[] = [
  {
    label: 'Light',
    value: 'lara-light-blue',
    href: `${PRIMEREACT_CDN}/lara-light-blue/theme.css`,
    mode: 'light'
  },
  {
    label: 'Dark',
    value: 'lara-dark-blue',
    href: `${PRIMEREACT_CDN}/lara-dark-blue/theme.css`,
    mode: 'dark'
  }
];
