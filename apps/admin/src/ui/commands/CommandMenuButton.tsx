import { useMemo, useRef } from 'react';
import { Button } from 'primereact/button';
import { TieredMenu } from 'primereact/tieredmenu';
import type { TieredMenu as TieredMenuType } from 'primereact/tieredmenu';

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

  if (items.length === 0) {
    return null;
  }

  const model = items;

  const menuRef = useRef<TieredMenuType>(null);
  const classes = [
    'ch-command-menu-trigger',
    size === 'small' ? 'p-button-sm' : '',
    className
  ]
    .filter(Boolean)
    .join(' ');

  const popupClassName = [
    'ch-command-menu-popup',
    size === 'small' ? 'ch-command-menu-popup-sm' : ''
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <TieredMenu
        ref={menuRef}
        model={model}
        popup
        className={popupClassName}
        appendTo={typeof document !== 'undefined' ? document.body : undefined}
      />
      <Button
        type="button"
        icon={buttonIcon}
        label={buttonLabel}
        text={text}
        outlined={!text}
        size={size}
        className={classes}
        disabled={disabled}
        aria-label={buttonLabel || 'More actions'}
        onClick={(event) => menuRef.current?.toggle(event)}
      />
    </>
  );
}
