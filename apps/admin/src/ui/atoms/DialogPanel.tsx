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
  maximizable,
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
  const contentClass = ['p-dialog', 'p-component', className].filter(Boolean).join(' ');

  return (
    <Dialog.Root open={visible} onOpenChange={(open) => { if (!open) onHide(); }}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="p-dialog-mask p-component-overlay p-dialog-visible"
          onClick={dismissableMask ? onHide : undefined}
          style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}
        />
        <Dialog.Content
          className={contentClass}
          style={{ position: 'fixed', zIndex: 1101, ...style }}
          onInteractOutside={dismissableMask ? () => onHide() : (e) => e.preventDefault()}
          onEscapeKeyDown={() => onHide()}
          aria-describedby={undefined}
        >
          <div className="p-dialog-header">
            {header != null && (
              <Dialog.Title asChild>
                <span className="p-dialog-title">{header}</span>
              </Dialog.Title>
            )}
            {(closable || maximizable) && (
              <div className="p-dialog-header-icons">
                {closable && (
                  <Dialog.Close asChild>
                    <button className="p-dialog-header-icon p-dialog-header-close p-link" type="button" aria-label="Close">
                      <span className="p-dialog-header-close-icon pi pi-times" />
                    </button>
                  </Dialog.Close>
                )}
              </div>
            )}
          </div>
          <div className="p-dialog-content">
            {children}
          </div>
          {footer != null && (
            <div className="p-dialog-footer">
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
