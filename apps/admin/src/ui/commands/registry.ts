import { extensionCommandRegistrations } from '../../extensions/core/registry';
import type { Command, CommandContext, CommandPlacement, CommandRegistration } from './types';

type CommandSource = 'core' | 'extension';

type RegisteredCommand = {
  placement: CommandPlacement;
  source: CommandSource;
  command: Command<any>;
};

function commandKey(placement: CommandPlacement, id: string, source: CommandSource): string {
  return `${source}:${placement}:${id}`;
}

export class CommandRegistry {
  private readonly commandMap = new Map<string, RegisteredCommand>();

  registerCoreCommands<TContext extends CommandContext>(registrations: CommandRegistration<TContext>[]): void {
    this.register('core', registrations);
  }

  registerExtensionCommands<TContext extends CommandContext>(registrations: CommandRegistration<TContext>[]): void {
    this.register('extension', registrations);
  }

  getCommands<TContext extends CommandContext>(context: TContext, placement: CommandPlacement): Command<TContext>[] {
    const entries = Array.from(this.commandMap.values()).filter((entry) => entry.placement === placement);
    return entries
      .map((entry) => {
        const base = entry.command as Command<TContext>;
        if (base.visible && !base.visible(context)) {
          return null;
        }
        if (entry.source === 'extension' && !base.group) {
          return { ...base, group: 'Extensions' } as Command<TContext>;
        }
        return base;
      })
      .filter((entry): entry is Command<TContext> => Boolean(entry));
  }

  private register<TContext extends CommandContext>(source: CommandSource, registrations: CommandRegistration<TContext>[]): void {
    for (const registration of registrations) {
      for (const command of registration.commands) {
        this.commandMap.set(commandKey(registration.placement, command.id, source), {
          placement: registration.placement,
          source,
          command
        });
      }
    }
  }
}

export const commandRegistry = new CommandRegistry();

commandRegistry.registerExtensionCommands(extensionCommandRegistrations);
