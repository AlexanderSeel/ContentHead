import { useEffect, useMemo, useState } from 'react';
import { Select } from '../../ui/atoms';

import { createAdminSdk } from '../../lib/sdk';

type ContentItem = {
  id: number;
  contentTypeId: number;
};

export function ContentReferencePicker({
  token,
  siteId,
  value,
  onChange,
  items: itemsProp
}: {
  token: string | null;
  siteId: number;
  value: number | null;
  onChange: (value: number | null) => void;
  items?: { id: number; label: string }[];
}) {
  const sdk = useMemo(() => createAdminSdk(token), [token]);
  const [loadedItems, setLoadedItems] = useState<{ id: number; label: string }[]>([]);

  useEffect(() => {
    if (itemsProp !== undefined) return;
    sdk
      .listContentItems({ siteId })
      .then((res) => {
        const all = (res.listContentItems ?? []) as ContentItem[];
        setLoadedItems(all.map((item) => ({ id: item.id, label: `#${item.id} (type ${item.contentTypeId})` })));
      })
      .catch(() => setLoadedItems([]));
  }, [sdk, siteId, itemsProp]);

  const options = (itemsProp ?? loadedItems).map((item) => ({
    label: item.label,
    value: item.id
  }));

  return (
    <Select
      value={value}
      options={options}
      onChange={(v) => onChange(v as number | null)}
      placeholder="Select content item"
      filter
      showClear
    />
  );
}
