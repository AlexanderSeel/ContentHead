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

  if (groups.length === 1) {
    return groups[0]![1].map((command) => toMenuItem(command, context));
  }

  return groups.map(([group, groupCommands]) => ({
    label: group,
    items: groupCommands.map((command) => toMenuItem(command, context))
  }));
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
