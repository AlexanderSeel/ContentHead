import { useEffect, useMemo, useState } from 'react';
import { AutoComplete } from 'primereact/autocomplete';

import { createAdminSdk } from '../../lib/sdk';

type ContentItem = {
  id: number;
  contentTypeId: number;
};

export function ContentReferencePicker({
  token,
  siteId,
  value,
  onChange
}: {
  token: string | null;
  siteId: number;
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  const sdk = useMemo(() => createAdminSdk(token), [token]);
  const [suggestions, setSuggestions] = useState<ContentItem[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handle = window.setTimeout(() => {
      sdk
        .listContentItems({ siteId })
        .then((res) => {
          const all = (res.listContentItems ?? []) as ContentItem[];
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

  return (
    <AutoComplete
      dropdown
      value={value ?? undefined}
      suggestions={suggestions}
      completeMethod={(event) => setQuery(event.query)}
      field="id"
      itemTemplate={(item: ContentItem) => <span>#{item.id} (type {item.contentTypeId})</span>}
      selectedItemTemplate={(item: ContentItem | number) => {
        if (typeof item === 'number') {
          return <span>#{item}</span>;
        }
        return <span>#{item.id}</span>;
      }}
      onChange={(event) => {
        const candidate = event.value as ContentItem | number | null;
        if (candidate == null) {
          onChange(null);
        } else if (typeof candidate === 'number') {
          onChange(candidate);
        } else {
          onChange(candidate.id);
        }
      }}
      placeholder="Select content item"
    />
  );
}
