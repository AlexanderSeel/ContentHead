import { useMemo, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';

import { Button } from '../atoms';
import { toTieredMenuItems } from './menuModel';
import type { Command, CommandContext } from './types';

export function CommandMenuButton<TContext extends CommandContext>({
  commands,
  context,
  buttonLabel = 'More',
  buttonIcon = 'pi pi-ellipsis-h',
  text = true,
  size = 'small',
  className,
  disabled = false
}: {
  commands: Command<TContext>[];
  context: TContext;
  buttonLabel?: string;
  buttonIcon?: string;
  text?: boolean;
  size?: 'small' | 'large';
  className?: string;
  disabled?: boolean;
}) {
  const items = useMemo(() => toTieredMenuItems(commands, context), [commands, context]);
  const [open, setOpen] = useState(false);

  if (items.length === 0) {
    return null;
  }

  const triggerClasses = [
    'ch-command-menu-trigger',
    size === 'small' ? 'p-button-sm' : '',
    className
  ]
    .filter(Boolean)
    .join(' ');

  const popupClasses = [
    'ch-command-menu-popup',
    'p-menu',
    'p-component',
    size === 'small' ? 'ch-command-menu-popup-sm' : ''
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <Button
          type="button"
          icon={buttonIcon}
          label={buttonLabel}
          text={text}
          outlined={!text}
          size={size}
          className={triggerClasses}
          disabled={disabled}
          aria-label={buttonLabel || 'More actions'}
        />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className={popupClasses} align="end" sideOffset={4}>
          <ul className="p-menu-list">
            {items.map((item, i) =>
              item.separator ? (
                <li key={i} className="p-menuitem-separator" role="separator" />
              ) : (
                <li key={item.id ?? i} className={`p-menuitem${item.className ? ` ${item.className}` : ''}`}>
                  <button
                    type="button"
                    className={`p-menuitem-link${item.disabled ? ' p-disabled' : ''}`}
                    disabled={item.disabled}
                    onClick={() => {
                      (item.command as (() => void) | undefined)?.();
                      setOpen(false);
                    }}
                  >
                    {item.icon ? <span className={`p-menuitem-icon ${item.icon}`} aria-hidden /> : null}
                    <span className="p-menuitem-text">{item.label}</span>
                  </button>
                </li>
              )
            )}
          </ul>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
