import { useMemo, useState } from 'react';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';

import { createAdminSdk } from '../../../lib/sdk';
import { getApiBaseUrl } from '../../../lib/api';
import { AssetPickerButton } from '../../../ui/atoms';

type AssetRow = {
  id: number;
  originalName: string;
  title?: string | null;
  altText?: string | null;
};

function AssetPreview({ id }: { id: number }) {
  const base = getApiBaseUrl();
  return (
    <img
      src={`${base}/assets/${id}/rendition/thumb`}
      alt="asset"
      className="w-4rem h-3rem border-round-sm object-cover"
    />
  );
}

export function AssetRefEditor({
  token,
  siteId,
  value,
  onChange
}: {
  token: string | null;
  siteId: number;
  value: number | { assetId: number | null; renditionKind?: string; fitMode?: string; customWidth?: number } | null;
  onChange: (value: number | { assetId: number | null; renditionKind?: string; fitMode?: string; customWidth?: number } | null) => void;
}) {
  const sdk = useMemo(() => createAdminSdk(token), [token]);
  const [asset, setAsset] = useState<AssetRow | null>(null);
  const selection = typeof value === 'number' ? { assetId: value } : (value ?? { assetId: null });
  const selectedId = selection.assetId ?? null;

  const load = async (id: number | null) => {
    if (!id) {
      setAsset(null);
      return;
    }
    const res = await sdk.getAsset({ id });
    setAsset((res.getAsset as AssetRow | null) ?? null);
  };

  return (
    <div className="form-row">
      <div className="inline-actions asset-ref-row">
        <div className="inline-actions asset-ref-actions">
          <AssetPickerButton
            token={token}
            siteId={siteId}
            selected={selectedId ? [selectedId] : []}
            onChange={(assetIds) => {
              const next = assetIds[0] ?? null;
              onChange(next ? { ...selection, assetId: next } : null);
              load(next).catch(() => undefined);
            }}
            label="Select asset"
          />
          <Button
            text
            label="Clear"
            onClick={() => {
              onChange(null);
              setAsset(null);
            }}
            disabled={!selectedId}
          />
        </div>
        {selectedId ? (
          <div className="inline-actions asset-ref-selected">
            <AssetPreview id={selectedId} />
            <small>{asset?.title ?? asset?.originalName ?? `Asset #${selectedId}`}</small>
          </div>
        ) : (
          <small className="muted">No asset selected</small>
        )}
      </div>
      <div className="inline-actions mt-2">
        <Dropdown
          value={selection.renditionKind ?? 'medium'}
          options={[
            { label: 'Original', value: 'original' },
            { label: 'Thumb', value: 'thumb' },
            { label: 'Small', value: 'small' },
            { label: 'Medium', value: 'medium' },
            { label: 'Large', value: 'large' }
          ]}
          onChange={(event) => onChange({ ...selection, renditionKind: String(event.value) })}
        />
        <Dropdown
          value={selection.fitMode ?? 'cover'}
          options={[{ label: 'Cover', value: 'cover' }, { label: 'Contain', value: 'contain' }]}
          onChange={(event) => onChange({ ...selection, fitMode: String(event.value) })}
        />
        <InputNumber
          value={selection.customWidth ?? null}
          onValueChange={(event) => {
            const width = Number(event.value ?? 0);
            if (width > 0) {
              onChange({ ...selection, customWidth: width });
              return;
            }
            const next = { ...selection } as { assetId: number | null; renditionKind?: string; fitMode?: string };
            onChange(next);
          }}
          placeholder="Custom width"
          min={1}
          max={2400}
          useGrouping={false}
        />
      </div>
    </div>
  );
}

export function AssetListEditor({
  token,
  siteId,
  value,
  onChange
}: {
  token: string | null;
  siteId: number;
  value: number[];
  onChange: (value: number[]) => void;
}) {
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= value.length) {
      return;
    }
    const next = [...value];
    const [current] = next.splice(index, 1);
    if (!current) {
      return;
    }
    next.splice(target, 0, current);
    onChange(next);
  };

  return (
    <div className="form-row">
      <div className="inline-actions">
        <AssetPickerButton
          token={token}
          siteId={siteId}
          selected={value}
          multiple
          onChange={onChange}
          label="Add assets"
        />
      </div>
      <DataTable value={value.map((id) => ({ id }))} size="small">
        <Column header="Preview" body={(row: { id: number }) => <AssetPreview id={row.id} />} />
        <Column field="id" header="Asset ID" />
        <Column
          header="Order"
          body={(row: { id: number }, options) => (
            <div className="inline-actions">
              <Button text icon="pi pi-angle-up" onClick={() => move(options.rowIndex, -1)} />
              <Button text icon="pi pi-angle-down" onClick={() => move(options.rowIndex, 1)} />
            </div>
          )}
        />
        <Column
          header="Actions"
          body={(row: { id: number }) => (
            <Button text severity="danger" label="Remove" onClick={() => onChange(value.filter((id) => id !== row.id))} />
          )}
        />
      </DataTable>
    </div>
  );
}

