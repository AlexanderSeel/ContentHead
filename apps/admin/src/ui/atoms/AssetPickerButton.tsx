import { useState } from 'react';
import { Button } from './Button';

import { AssetPickerDialog } from '../../components/inputs/AssetPickerDialog';

export function AssetPickerButton({
  token,
  siteId,
  selected,
  onChange,
  multiple,
  label
}: {
  token: string | null;
  siteId: number;
  selected: number[];
  onChange: (next: number[]) => void;
  multiple?: boolean;
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button label={label ?? (multiple ? 'Pick Assets' : 'Pick Asset')} onClick={() => setOpen(true)} />
      <AssetPickerDialog
        visible={open}
        token={token}
        siteId={siteId}
        selected={selected}
        {...(multiple ? { multiple: true } : {})}
        onHide={() => setOpen(false)}
        onApply={(next) => {
          onChange(next);
          setOpen(false);
        }}
      />
    </>
  );
}
