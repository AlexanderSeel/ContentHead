import { Select } from '../../ui/atoms';

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
    <Select
      filter
      value={`${marketCode}::${localeCode}`}
      options={options}
      onChange={(next) => {
        if (!next) return;
        const [nextMarket, nextLocale] = next.split('::');
        if (nextMarket && nextLocale) {
          onChange({ marketCode: nextMarket, localeCode: nextLocale });
        }
      }}
      placeholder="Market/Locale"
    />
  );
}
