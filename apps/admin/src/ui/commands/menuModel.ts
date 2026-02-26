import type { MenuItem } from 'primereact/menuitem';
import type { Command, CommandContext } from './types';

export async function executeCommand<TContext extends CommandContext>(command: Command<TContext>, context: TContext): Promise<void> {
  if (command.requiresConfirm) {
    const message = command.confirmText ?? `Run "${command.label}"?`;
    const confirmed = context.confirm
      ? await context.confirm({
          header: 'Confirm Action',
          message,
          acceptLabel: 'Confirm',
          rejectLabel: 'Cancel'
        })
      : window.confirm(message);
    if (!confirmed) {
      return;
    }
  }
  await command.run(context);
}

export function toTieredMenuItems<TContext extends CommandContext>(commands: Command<TContext>[], context: TContext): MenuItem[] {
  const grouped = new Map<string, Command<TContext>[]>();
  for (const command of commands) {
    if (command.visible && !command.visible(context)) {
      continue;
    }
    const group = command.group ?? 'General';
    const groupRows = grouped.get(group) ?? [];
    groupRows.push(command);
    grouped.set(group, groupRows);
  }

  const groups = Array.from(grouped.entries());
  if (groups.length === 0) {
    return [];
  }

  // Flatten grouped commands so row menus remain directly actionable even in tight layouts.
  // Group boundaries are represented with separators instead of nested submenus.
  const items: MenuItem[] = [];
  groups.forEach(([, groupCommands], groupIndex) => {
    if (groupIndex > 0 && groupCommands.length > 0) {
      items.push({ separator: true });
    }
    items.push(...groupCommands.map((command) => toMenuItem(command, context)));
  });
  return items;
}

function toMenuItem<TContext extends CommandContext>(command: Command<TContext>, context: TContext): MenuItem {
  return {
    id: command.id,
    label: command.label,
    icon: command.icon,
    disabled: command.enabled ? !command.enabled(context) : false,
    className: command.danger ? 'ch-command-danger' : undefined,
    ...(command.tooltip ? { data: { tooltip: command.tooltip } } : {}),
    command: () => {
      void executeCommand(command, context);
    }
  };
}
