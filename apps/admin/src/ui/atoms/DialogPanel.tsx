import type { CSSProperties, ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';

export function DialogPanel({
  visible,
  onHide,
  header,
  footer,
  className,
  style,
  closable = true,
  dismissableMask,
  maximizable: _maximizable,
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
    <Dialog.Root open={visible} onOpenChange={(open) => { if (!open) onHide(); }}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="ch-overlay"
          onClick={dismissableMask ? onHide : undefined}
        />
        <Dialog.Content
          className={['ch-dialog', className].filter(Boolean).join(' ')}
          style={style}
          onInteractOutside={dismissableMask ? () => onHide() : (e) => e.preventDefault()}
          onEscapeKeyDown={() => onHide()}
          aria-describedby={undefined}
        >
          {(header != null || closable) && (
            <div className="ch-dialog-header">
              {header != null && (
                <Dialog.Title className="ch-dialog-title">{header}</Dialog.Title>
              )}
              {closable && (
                <Dialog.Close className="ch-dialog-close" aria-label="Close">
                  <span className="pi pi-times" aria-hidden="true" />
                </Dialog.Close>
              )}
            </div>
          )}
          <div className="ch-dialog-body">
            {children}
          </div>
          {footer != null && (
            <div className="ch-dialog-footer">
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
