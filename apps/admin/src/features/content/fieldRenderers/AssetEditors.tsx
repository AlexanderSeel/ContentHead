import { useEffect, useMemo, useState } from 'react';
import { Button, Checkbox, NumberInput, Select } from '../../../ui/atoms';
import { DataGrid } from '../../../ui/molecules';

import { createAdminSdk } from '../../../lib/sdk';
import { getApiBaseUrl } from '../../../lib/api';
import { AssetPickerButton } from '../../../ui/atoms';
import { AssetImageEditorDialog } from '../../assets/AssetImageEditorDialog';

type AssetRow = {
  id: number;
  originalName: string;
  title?: string | null;
  altText?: string | null;
  renditionPresets?: Array<{ id: string; name: string; width: number; height: number }>;
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
  value: number | { assetId: number | null; renditionKind?: string; fitMode?: string; customWidth?: number; presetId?: string; showPois?: boolean } | null;
  onChange: (value: number | { assetId: number | null; renditionKind?: string; fitMode?: string; customWidth?: number; presetId?: string; showPois?: boolean } | null) => void;
}) {
  const sdk = useMemo(() => createAdminSdk(token), [token]);
  const [asset, setAsset] = useState<AssetRow | null>(null);
  const [imageEditorAssetId, setImageEditorAssetId] = useState<number | null>(null);
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

  useEffect(() => {
    load(selectedId).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const presetOptions = (asset?.renditionPresets ?? []).map((entry) => ({
    label: `${entry.name} (${entry.width}x${entry.height})`,
    value: entry.id
  }));

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
          <Button text label="Edit image" onClick={() => selectedId && setImageEditorAssetId(selectedId)} disabled={!selectedId} />
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
        <Select
          value={selection.renditionKind ?? 'medium'}
          options={[
            { label: 'Original', value: 'original' },
            { label: 'Thumb', value: 'thumb' },
            { label: 'Small', value: 'small' },
            { label: 'Medium', value: 'medium' },
            { label: 'Large', value: 'large' }
          ]}
          onChange={(next) => onChange({ ...selection, renditionKind: next ?? 'medium' })}
        />
        <Select
          value={selection.fitMode ?? 'cover'}
          options={[{ label: 'Cover', value: 'cover' }, { label: 'Contain', value: 'contain' }]}
          onChange={(next) => onChange({ ...selection, fitMode: next ?? 'cover' })}
        />
        <NumberInput
          value={selection.customWidth ?? null}
          onChange={(next) => {
            if (next && next > 0) {
              onChange({ ...selection, customWidth: next });
              return;
            }
            const { customWidth: _removed, ...rest } = selection as any;
            onChange(rest);
          }}
          min={1}
          max={2400}
        />
        <Select
          value={selection.presetId ?? null}
          options={presetOptions}
          onChange={(next) => {
            const next2 = { ...selection } as {
              assetId: number | null;
              renditionKind?: string;
              fitMode?: string;
              customWidth?: number;
              presetId?: string;
              showPois?: boolean;
            };
            if (next) {
              next2.presetId = next;
            } else {
              delete next2.presetId;
            }
            onChange(next2);
          }}
          placeholder="Preset"
          showClear
          disabled={!selectedId || presetOptions.length === 0}
        />
        <label>
          <Checkbox
            checked={Boolean(selection.showPois)}
            onChange={(next) => onChange({ ...selection, showPois: next })}
            disabled={!selectedId}
          />{' '}
          Show POIs
        </label>
      </div>
      <AssetImageEditorDialog
        visible={imageEditorAssetId != null}
        assetId={imageEditorAssetId}
        token={token}
        siteId={siteId}
        onHide={() => setImageEditorAssetId(null)}
        onSaved={() => load(selectedId).catch(() => undefined)}
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
      <DataGrid
        data={value.map((id) => ({ id }))}
        rowKey="id"
        columns={[
          { key: 'preview', header: 'Preview', cell: (row) => <AssetPreview id={row.id} /> },
          { key: 'id', header: 'Asset ID' },
          {
            key: '__order',
            header: 'Order',
            cell: (_row, index) => (
              <div className="inline-actions">
                <Button text icon="pi pi-angle-up" onClick={() => move(index, -1)} />
                <Button text icon="pi pi-angle-down" onClick={() => move(index, 1)} />
              </div>
            )
          },
          {
            key: '__actions',
            header: 'Actions',
            cell: (row) => (
              <Button text severity="danger" label="Remove" onClick={() => onChange(value.filter((id) => id !== row.id))} />
            )
          }
        ]}
      />
    </div>
  );
}

