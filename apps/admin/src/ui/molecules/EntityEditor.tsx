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
    <Dialog header={title} visible={visible} onHide={onHide} className="w-11 lg:w-9 xl:w-8" footer={footer}>
      {children}
    </Dialog>
  );
}
