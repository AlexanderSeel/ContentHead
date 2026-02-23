import { jsx as _jsx } from "react/jsx-runtime";
import { Dropdown } from 'primereact/dropdown';
export function MarketLocalePicker({ combos, marketCode, localeCode, onChange }) {
    const options = combos
        .filter((entry) => entry.active)
        .map((entry) => ({
        label: `${entry.marketCode}/${entry.localeCode}`,
        value: `${entry.marketCode}::${entry.localeCode}`
    }));
    return (_jsx(Dropdown, { filter: true, value: `${marketCode}::${localeCode}`, options: options, onChange: (event) => {
            const [nextMarket, nextLocale] = String(event.value).split('::');
            if (nextMarket && nextLocale) {
                onChange({ marketCode: nextMarket, localeCode: nextLocale });
            }
        }, placeholder: "Market/Locale" }));
}
