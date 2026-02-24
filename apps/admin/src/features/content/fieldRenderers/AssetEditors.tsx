import { useMemo, useState } from 'react';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';

import { AssetPickerDialog } from '../../../components/inputs/AssetPickerDialog';
import { createAdminSdk } from '../../../lib/sdk';
import { getApiBaseUrl } from '../../../lib/api';

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
      style={{ width: 56, height: 40, objectFit: 'cover', borderRadius: 6 }}
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
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  const sdk = useMemo(() => createAdminSdk(token), [token]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [asset, setAsset] = useState<AssetRow | null>(null);

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
      <div className="inline-actions">
        <Button label="Select asset" onClick={() => setPickerOpen(true)} />
        <Button
          text
          label="Clear"
          onClick={() => {
            onChange(null);
            setAsset(null);
          }}
          disabled={!value}
        />
      </div>
      {value ? (
        <div className="inline-actions">
          <AssetPreview id={value} />
          <small>{asset?.title ?? asset?.originalName ?? `Asset #${value}`}</small>
        </div>
      ) : (
        <small className="muted">No asset selected</small>
      )}
      <AssetPickerDialog
        visible={pickerOpen}
        token={token}
        siteId={siteId}
        selected={value ? [value] : []}
        onHide={() => setPickerOpen(false)}
        onApply={(assetIds) => {
          const next = assetIds[0] ?? null;
          onChange(next);
          load(next).catch(() => undefined);
        }}
      />
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
  const [pickerOpen, setPickerOpen] = useState(false);

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
        <Button label="Add assets" onClick={() => setPickerOpen(true)} />
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
      <AssetPickerDialog
        visible={pickerOpen}
        token={token}
        siteId={siteId}
        multiple
        selected={value}
        onHide={() => setPickerOpen(false)}
        onApply={(assetIds) => onChange(assetIds)}
      />
    </div>
  );
}
