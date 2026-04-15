import * as Dialog from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';

export type SidebarPosition = 'left' | 'right' | 'top' | 'bottom';

export type SidebarProps = {
  visible?: boolean;
  onHide?: () => void;
  position?: SidebarPosition;
  className?: string;
  children?: ReactNode;
  header?: ReactNode;
};

export function Sidebar({ visible = false, onHide, position = 'right', className, children, header }: SidebarProps) {
  const posClass = `p-sidebar-${position}`;
  const classes = ['p-sidebar', 'p-component', posClass, className].filter(Boolean).join(' ');

  return (
    <Dialog.Root open={visible} onOpenChange={(open) => { if (!open) onHide?.(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="p-sidebar-mask" onClick={() => onHide?.()} />
        <Dialog.Content className={classes} aria-describedby={undefined}>
          <div className="p-sidebar-header">
            {header ? <Dialog.Title asChild>{header}</Dialog.Title> : <Dialog.Title />}
            <button
              type="button"
              className="p-sidebar-close p-link"
              onClick={() => onHide?.()}
              aria-label="Close"
            >
              <span className="pi pi-times" aria-hidden />
            </button>
          </div>
          <div className="p-sidebar-content">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
