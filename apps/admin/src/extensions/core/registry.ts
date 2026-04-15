import type { AdminExtension, ExtensionInspectorPanel } from './types';
import { navRegistry } from '../../layout/navRegistry';

const modules = import.meta.glob('../*/index.ts*', { eager: true }) as Record<string, { extension?: AdminExtension }>;

const loaded: AdminExtension[] = Object.values(modules)
  .map((entry) => entry.extension)
  .filter((entry): entry is AdminExtension => Boolean(entry && entry.id));

loaded.sort((a, b) => a.label.localeCompare(b.label));

// Register each extension's nav items into the shared navRegistry.
for (const ext of loaded) {
  for (const item of ext.menu ?? []) {
    navRegistry.register({
      id: `${ext.id}::${item.to}`,
      ...item
    });
  }
}

export const extensionRegistry = loaded;

export const extensionRoutes = loaded.flatMap((entry) => entry.routes ?? []);

export const extensionInspectorPanels: ExtensionInspectorPanel[] = loaded.flatMap((entry) => entry.inspectorPanels ?? []);

export const extensionCommandRegistrations = loaded.flatMap((entry) => entry.commands ?? []);
