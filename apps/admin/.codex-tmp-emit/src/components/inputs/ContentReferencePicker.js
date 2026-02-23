import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { AutoComplete } from 'primereact/autocomplete';
import { createAdminSdk } from '../../lib/sdk';
export function ContentReferencePicker({ token, siteId, value, onChange }) {
    const sdk = useMemo(() => createAdminSdk(token), [token]);
    const [suggestions, setSuggestions] = useState([]);
    const [query, setQuery] = useState('');
    useEffect(() => {
        const handle = window.setTimeout(() => {
            sdk
                .listContentItems({ siteId })
                .then((res) => {
                const all = (res.listContentItems ?? []);
                const normalized = query.trim().toLowerCase();
                const filtered = normalized
                    ? all.filter((entry) => String(entry.id).includes(normalized) || String(entry.contentTypeId).includes(normalized))
                    : all.slice(0, 15);
                setSuggestions(filtered.slice(0, 20));
            })
                .catch(() => setSuggestions([]));
        }, 200);
        return () => window.clearTimeout(handle);
    }, [sdk, siteId, query]);
    return (_jsx(AutoComplete, { dropdown: true, value: value ?? undefined, suggestions: suggestions, completeMethod: (event) => setQuery(event.query), field: "id", itemTemplate: (item) => _jsxs("span", { children: ["#", item.id, " (type ", item.contentTypeId, ")"] }), selectedItemTemplate: (item) => {
            if (typeof item === 'number') {
                return _jsxs("span", { children: ["#", item] });
            }
            return _jsxs("span", { children: ["#", item.id] });
        }, onChange: (event) => {
            const candidate = event.value;
            if (candidate == null) {
                onChange(null);
            }
            else if (typeof candidate === 'number') {
                onChange(candidate);
            }
            else {
                onChange(candidate.id);
            }
        }, placeholder: "Select content item" }));
}
