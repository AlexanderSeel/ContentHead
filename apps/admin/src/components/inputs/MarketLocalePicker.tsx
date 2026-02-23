import { Dropdown } from 'primereact/dropdown';

type Combo = { marketCode: string; localeCode: string; active: boolean };

export function MarketLocalePicker({
  combos,
  marketCode,
  localeCode,
  onChange
}: {
  combos: Combo[];
  marketCode: string;
  localeCode: string;
  onChange: (next: { marketCode: string; localeCode: string }) => void;
}) {
  const options = combos
    .filter((entry) => entry.active)
    .map((entry) => ({
      label: `${entry.marketCode}/${entry.localeCode}`,
      value: `${entry.marketCode}::${entry.localeCode}`
    }));

  return (
    <Dropdown
      filter
      value={`${marketCode}::${localeCode}`}
      options={options}
      onChange={(event) => {
        const [nextMarket, nextLocale] = String(event.value).split('::');
        if (nextMarket && nextLocale) {
          onChange({ marketCode: nextMarket, localeCode: nextLocale });
        }
      }}
      placeholder="Market/Locale"
    />
  );
}
