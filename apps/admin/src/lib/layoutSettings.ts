const WORKSPACE_PANEL_PREFIX = 'contenthead.workspace.panels.';
export const CONTENT_PAGES_WORKSPACE_SIZES_KEY = 'content-pages.workspace.sizes';

export type LayoutStorageKind = 'workspace-panels' | 'split-sizes' | 'custom';

export type LayoutStorageEntry = {
  storageKey: string;
  section: string;
  kind: LayoutStorageKind;
  exists: boolean;
  summary: string;
};

type KnownLayoutDefinition = {
  storageKey: string;
  section: string;
  kind: LayoutStorageKind;
};

const KNOWN_LAYOUTS: KnownLayoutDefinition[] = [
  {
    storageKey: CONTENT_PAGES_WORKSPACE_SIZES_KEY,
    section: 'Content Pages: Main Workspace',
    kind: 'split-sizes'
  },
  {
    storageKey: `${WORKSPACE_PANEL_PREFIX}content-assets`,
    section: 'Content Assets: Panels',
    kind: 'workspace-panels'
  },
  {
    storageKey: `${WORKSPACE_PANEL_PREFIX}security-users`,
    section: 'Security Users: Panels',
    kind: 'workspace-panels'
  },
  {
    storageKey: `${WORKSPACE_PANEL_PREFIX}security-roles`,
    section: 'Security Roles: Panels',
    kind: 'workspace-panels'
  },
  {
    storageKey: `${WORKSPACE_PANEL_PREFIX}workflows-designer`,
    section: 'Workflow Designer: Panels',
    kind: 'workspace-panels'
  },
  {
    storageKey: `${WORKSPACE_PANEL_PREFIX}workflows-runs`,
    section: 'Workflow Runs: Panels',
    kind: 'workspace-panels'
  },
  {
    storageKey: `${WORKSPACE_PANEL_PREFIX}settings-db-admin`,
    section: 'DB Admin: Panels',
    kind: 'workspace-panels'
  },
  {
    storageKey: `${WORKSPACE_PANEL_PREFIX}dev-graphiql`,
    section: 'GraphiQL Dev Tool: Panels',
    kind: 'workspace-panels'
  }
];

function toTitleCase(value: string): string {
  return value
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function inferSectionLabel(storageKey: string): string {
  if (storageKey === CONTENT_PAGES_WORKSPACE_SIZES_KEY) {
    return 'Content Pages: Main Workspace';
  }
  if (storageKey.startsWith(WORKSPACE_PANEL_PREFIX)) {
    const workspaceId = storageKey.slice(WORKSPACE_PANEL_PREFIX.length);
    return `${toTitleCase(workspaceId)}: Panels`;
  }
  return storageKey;
}

function inferKind(storageKey: string): LayoutStorageKind {
  if (storageKey.startsWith(WORKSPACE_PANEL_PREFIX)) {
    return 'workspace-panels';
  }
  if (storageKey === CONTENT_PAGES_WORKSPACE_SIZES_KEY) {
    return 'split-sizes';
  }
  return 'custom';
}

function summarizeWorkspacePanels(raw: string): string {
  try {
    const parsed = JSON.parse(raw) as {
      topCollapsed?: Record<string, boolean>;
      bottomCollapsed?: boolean;
    };
    const collapsedTop = Object.values(parsed.topCollapsed ?? {}).filter(Boolean).length;
    const bottomCollapsed = Boolean(parsed.bottomCollapsed);
    const collapsedSegments = [
      collapsedTop > 0 ? `${collapsedTop} top panel${collapsedTop === 1 ? '' : 's'} hidden` : null,
      bottomCollapsed ? 'bottom panel hidden' : null
    ].filter(Boolean);
    return collapsedSegments.length > 0 ? collapsedSegments.join(', ') : 'Custom panel layout';
  } catch {
    return 'Custom panel layout';
  }
}

function summarizeSplitSizes(raw: string): string {
  try {
    const parsed = JSON.parse(raw) as number[];
    if (Array.isArray(parsed) && parsed.length === 2) {
      const left = Math.round(parsed[0] ?? 0);
      const right = Math.round(parsed[1] ?? 0);
      return `Left ${left}% / Right ${right}%`;
    }
    return 'Custom splitter sizes';
  } catch {
    return 'Custom splitter sizes';
  }
}

function summarizeValue(storageKey: string, raw: string): string {
  const kind = inferKind(storageKey);
  if (kind === 'workspace-panels') {
    return summarizeWorkspacePanels(raw);
  }
  if (kind === 'split-sizes') {
    return summarizeSplitSizes(raw);
  }
  return 'Custom layout';
}

function buildEntry(
  storageKey: string,
  exists: boolean,
  rawValue: string | null,
  known?: KnownLayoutDefinition
): LayoutStorageEntry {
  const section = known?.section ?? inferSectionLabel(storageKey);
  const kind = known?.kind ?? inferKind(storageKey);
  if (!exists || rawValue == null) {
    return {
      storageKey,
      section,
      kind,
      exists: false,
      summary: 'Default layout'
    };
  }
  return {
    storageKey,
    section,
    kind,
    exists: true,
    summary: summarizeValue(storageKey, rawValue)
  };
}

export function getLayoutStorageOverview(): LayoutStorageEntry[] {
  const knownMap = new Map(KNOWN_LAYOUTS.map((entry) => [entry.storageKey, entry]));
  if (typeof window === 'undefined') {
    return KNOWN_LAYOUTS.map((entry) => buildEntry(entry.storageKey, false, null, entry));
  }

  const persistedKeys = Object.keys(window.localStorage).filter(
    (key) => key.startsWith(WORKSPACE_PANEL_PREFIX) || key === CONTENT_PAGES_WORKSPACE_SIZES_KEY
  );
  const allKeys = Array.from(new Set([...KNOWN_LAYOUTS.map((entry) => entry.storageKey), ...persistedKeys]));
  return allKeys
    .map((storageKey) => {
      const rawValue = window.localStorage.getItem(storageKey);
      return buildEntry(storageKey, rawValue != null, rawValue, knownMap.get(storageKey));
    })
    .sort((a, b) => a.section.localeCompare(b.section));
}

export function resetLayoutStorageKey(storageKey: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.removeItem(storageKey);
}

export function resetAllLayoutStorage(): number {
  if (typeof window === 'undefined') {
    return 0;
  }
  const entries = getLayoutStorageOverview().filter((entry) => entry.exists);
  entries.forEach((entry) => window.localStorage.removeItem(entry.storageKey));
  return entries.length;
}
