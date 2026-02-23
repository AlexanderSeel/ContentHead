export type LocaleCatalogItem = {
  code: string;
  name: string;
  language: string;
  region: string;
};

export const localeCatalog: LocaleCatalogItem[] = [
  { code: 'de-DE', name: 'German (Germany)', language: 'German', region: 'Germany' },
  { code: 'de-AT', name: 'German (Austria)', language: 'German', region: 'Austria' },
  { code: 'de-CH', name: 'German (Switzerland)', language: 'German', region: 'Switzerland' },
  { code: 'en-US', name: 'English (United States)', language: 'English', region: 'United States' },
  { code: 'en-GB', name: 'English (United Kingdom)', language: 'English', region: 'United Kingdom' },
  { code: 'en-CA', name: 'English (Canada)', language: 'English', region: 'Canada' },
  { code: 'es-ES', name: 'Spanish (Spain)', language: 'Spanish', region: 'Spain' },
  { code: 'es-MX', name: 'Spanish (Mexico)', language: 'Spanish', region: 'Mexico' },
  { code: 'fr-FR', name: 'French (France)', language: 'French', region: 'France' },
  { code: 'fr-CA', name: 'French (Canada)', language: 'French', region: 'Canada' },
  { code: 'it-IT', name: 'Italian (Italy)', language: 'Italian', region: 'Italy' },
  { code: 'nl-NL', name: 'Dutch (Netherlands)', language: 'Dutch', region: 'Netherlands' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)', language: 'Portuguese', region: 'Brazil' },
  { code: 'pt-PT', name: 'Portuguese (Portugal)', language: 'Portuguese', region: 'Portugal' },
  { code: 'sv-SE', name: 'Swedish (Sweden)', language: 'Swedish', region: 'Sweden' },
  { code: 'ja-JP', name: 'Japanese (Japan)', language: 'Japanese', region: 'Japan' }
];
