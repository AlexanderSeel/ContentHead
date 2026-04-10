import type { CSSProperties, ReactNode } from 'react';
import { Dialog } from 'primereact/dialog';

export function DialogPanel({
  visible,
  onHide,
  header,
  footer,
  className,
  style,
  closable,
  dismissableMask,
  children
}: {
  visible: boolean;
  onHide: () => void;
  header?: string | ReactNode;
  footer?: ReactNode;
  className?: string;
  style?: CSSProperties;
  closable?: boolean;
  dismissableMask?: boolean;
  maximizable?: boolean;
  children?: ReactNode;
}) {
  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={header}
      footer={footer}
      className={className}
      style={style}
      closable={closable}
      dismissableMask={dismissableMask}
      maximizable={maximizable}
    >
      {children}
    </Dialog>
  );
}
