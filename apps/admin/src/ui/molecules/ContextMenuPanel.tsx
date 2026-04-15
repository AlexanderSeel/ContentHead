import { forwardRef, useImperativeHandle, useState, type ReactNode } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import type { MenuItem } from '../commands/menuModel';

export type { MenuItem };

export interface ContextMenuHandle {
  show(event: React.SyntheticEvent | React.MouseEvent | MouseEvent | { originalEvent?: React.SyntheticEvent | MouseEvent }): void;
  hide(event?: React.SyntheticEvent | React.MouseEvent): void;
}

type Position = { x: number; y: number };

function MenuItems({ items, onClose }: { items: MenuItem[]; onClose: () => void }) {
  return (
    <>
      {items.map((item, idx) => {
        if (item.separator) {
          return <DropdownMenu.Separator key={idx} className="p-menu-separator" />;
        }
        if (item.items?.length) {
          return (
            <DropdownMenu.Sub key={idx}>
              <DropdownMenu.SubTrigger className="p-menuitem-link" disabled={item.disabled ?? false}>
                {item.icon ? <span className={`p-menuitem-icon pi ${item.icon}`} aria-hidden /> : null}
                <span className="p-menuitem-text">{item.label}</span>
                <span className="pi pi-chevron-right p-submenu-icon" aria-hidden />
              </DropdownMenu.SubTrigger>
              <DropdownMenu.Portal>
                <DropdownMenu.SubContent className="p-menu p-contextmenu p-component">
                  <MenuItems items={item.items} onClose={onClose} />
                </DropdownMenu.SubContent>
              </DropdownMenu.Portal>
            </DropdownMenu.Sub>
          );
        }
        return (
          <DropdownMenu.Item
            key={idx}
            className="p-menuitem-link"
            disabled={item.disabled ?? false}
            onSelect={() => {
              item.command?.();
              onClose();
            }}
          >
            <>
              {item.icon ? <span className={`p-menuitem-icon pi ${item.icon}`} aria-hidden /> : null}
              <span className="p-menuitem-text">{item.label}</span>
            </>
          </DropdownMenu.Item>
        );
      })}
    </>
  );
}

export const ContextMenuPanel = forwardRef<ContextMenuHandle, { model: MenuItem[] }>(
  ({ model }, ref) => {
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState<Position>({ x: 0, y: 0 });

    useImperativeHandle(ref, () => ({
      show: (event) => {
        const nativeEvent =
          'originalEvent' in event && event.originalEvent
            ? event.originalEvent
            : (event as React.MouseEvent);
        const clientX = 'clientX' in nativeEvent ? nativeEvent.clientX : 0;
        const clientY = 'clientY' in nativeEvent ? nativeEvent.clientY : 0;
        setPos({ x: clientX, y: clientY });
        setOpen(true);
      },
      hide: () => setOpen(false)
    }));

    return (
      <DropdownMenu.Root open={open} onOpenChange={setOpen} modal={false}>
        {/* Invisible anchor pinned to mouse position */}
        <DropdownMenu.Trigger
          asChild
          style={{ position: 'fixed', left: pos.x, top: pos.y, width: 1, height: 1, pointerEvents: 'none' }}
        >
          <span aria-hidden />
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="p-menu p-contextmenu p-component"
            onCloseAutoFocus={(e: Event) => e.preventDefault()}
            align="start"
            side="bottom"
            sideOffset={0}
          >
            <ul className="p-menu-list" role="menu">
              <MenuItems items={model} onClose={() => setOpen(false)} />
            </ul>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    );
  }
);

ContextMenuPanel.displayName = 'ContextMenuPanel';
