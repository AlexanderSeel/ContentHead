import { useMemo, useRef } from 'react';
import { Button } from 'primereact/button';
import { TieredMenu } from 'primereact/tieredmenu';

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
  const menuRef = useRef<TieredMenu>(null);
  const items = useMemo(() => toTieredMenuItems(commands, context), [commands, context]);

  if (items.length === 0) {
    return null;
  }

  return (
    <>
      <TieredMenu popup ref={menuRef} model={items} />
      <Button
        label={buttonLabel}
        icon={buttonIcon}
        text={text}
        size={size}
        className={className}
        disabled={disabled}
        onClick={(event) => menuRef.current?.toggle(event)}
      />
    </>
  );
}
