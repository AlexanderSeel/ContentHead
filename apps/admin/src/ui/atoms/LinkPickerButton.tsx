import { useState } from 'react';
import { Button } from './Button';

import { LinkSelectorDialog, type ContentLinkValue } from '../../features/content/fieldRenderers/LinkSelectorDialog';

export function LinkPickerButton({
  token,
  siteId,
  value,
  onChange,
  label = 'Pick Link'
}: {
  token: string | null;
  siteId: number;
  value: ContentLinkValue | null;
  onChange: (next: ContentLinkValue) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button label={label} onClick={() => setOpen(true)} />
      <LinkSelectorDialog
        visible={open}
        token={token}
        siteId={siteId}
        value={value}
        onHide={() => setOpen(false)}
        onApply={(next) => {
          onChange(next);
          setOpen(false);
        }}
      />
    </>
  );
}
