import { useMemo } from 'react';
import { Menubar } from 'primereact/menubar';

import { toTieredMenuItems } from './menuModel';
import type { Command, CommandContext } from './types';

export function CommandMenuButton<TContext extends CommandContext>({
  commands,
  context,
  buttonLabel = 'More',
  buttonIcon: _buttonIcon = 'pi pi-ellipsis-h',
  text: _text = true,
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

  const classes = [
    size === 'small' ? 'p-menubar-sm' : '',
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Menubar model={model} className={classes} />
  );
}
