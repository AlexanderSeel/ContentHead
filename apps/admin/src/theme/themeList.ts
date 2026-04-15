export type ThemeOption = {
  label: string;
  value: string;
  mode: 'light' | 'dark';
};

export const PRIME_THEMES: ThemeOption[] = [
  { label: 'Light', value: 'lara-light-blue',  mode: 'light' },
  { label: 'Dark',  value: 'lara-dark-blue',   mode: 'dark'  }
];
