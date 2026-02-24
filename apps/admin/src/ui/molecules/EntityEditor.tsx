import type { ReactNode } from 'react';
import { Dialog } from 'primereact/dialog';

export function EntityEditor({
  visible,
  title,
  onHide,
  children,
  footer
}: {
  visible: boolean;
  title: string;
  onHide: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Dialog header={title} visible={visible} onHide={onHide} style={{ width: 'min(52rem, 96vw)' }} footer={footer}>
      {children}
    </Dialog>
  );
}
