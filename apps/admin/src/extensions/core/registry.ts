import type { AdminExtension, ExtensionInspectorPanel } from './types';

const modules = import.meta.glob('../*/index.ts*', { eager: true }) as Record<string, { extension?: AdminExtension }>;

const loaded: AdminExtension[] = Object.values(modules)
  .map((entry) => entry.extension)
  .filter((entry): entry is AdminExtension => Boolean(entry && entry.id));

loaded.sort((a, b) => a.label.localeCompare(b.label));

export const extensionRegistry = loaded;

export const extensionNavItems = loaded.flatMap((entry) => entry.menu ?? []);

export const extensionRoutes = loaded.flatMap((entry) => entry.routes ?? []);

export const extensionInspectorPanels: ExtensionInspectorPanel[] = loaded.flatMap((entry) => entry.inspectorPanels ?? []);

export const extensionCommandRegistrations = loaded.flatMap((entry) => entry.commands ?? []);
