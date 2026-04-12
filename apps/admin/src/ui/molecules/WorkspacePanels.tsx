import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '../atoms';
import { Splitter, SplitterPanel } from './SplitterLayout';
import { useWorkspaceFrame } from './WorkspacePage';
import type { NavMenuItem } from './WorkspacePage';

export type WorkspaceManagedPane = {
  id: string;
  label: string;
  defaultSize: number;
  minSize: number;
  collapsible?: boolean;
  header?: ReactNode;
  headerActions?: ReactNode;
  className?: string;
  scrollClassName?: string;
  content: ReactNode;
};

type PersistedPanelState = {
  topSizes: Record<string, number>;
  topCollapsed: Record<string, boolean>;
  topExpandedSizes: Record<string, number>;
  verticalTopSize?: number;
  bottomCollapsed?: boolean;
  bottomExpandedSize?: number;
};

type WorkspacePaneLayoutProps = {
  workspaceId: string;
  className?: string;
  left?: WorkspaceManagedPane;
  center: WorkspaceManagedPane;
  right?: WorkspaceManagedPane;
  bottom?: WorkspaceManagedPane;
};

function normalizeSizeMap(panelIds: string[], sizes: Record<string, number>, collapsed: Record<string, boolean>): Record<string, number> {
  const visibleIds = panelIds.filter((id) => !collapsed[id]);
  if (visibleIds.length === 0) {
    return panelIds.reduce<Record<string, number>>((acc, id) => ({ ...acc, [id]: 0 }), {});
  }

  const visibleSum = visibleIds.reduce((sum, id) => sum + Math.max(0, sizes[id] ?? 0), 0);
  if (visibleSum <= 0) {
    const equal = 100 / visibleIds.length;
    return panelIds.reduce<Record<string, number>>(
      (acc, id) => ({ ...acc, [id]: collapsed[id] ? 0 : equal }),
      {}
    );
  }

  return panelIds.reduce<Record<string, number>>((acc, id) => {
    if (collapsed[id]) {
      return { ...acc, [id]: 0 };
    }
    return { ...acc, [id]: ((sizes[id] ?? 0) / visibleSum) * 100 };
  }, {});
}

function loadPersistedState(storageKey: string): PersistedPanelState | null {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as PersistedPanelState;
    return parsed;
  } catch {
    return null;
  }
}

function savePersistedState(storageKey: string, state: PersistedPanelState): void {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    // no-op
  }
}

function renderPane(pane: WorkspaceManagedPane, collapsed: boolean): ReactNode {
  const headerContent = pane.header ?? <strong>{pane.label}</strong>;
  return (
    <div className={['paneRoot', 'workspacePane', pane.className, collapsed ? 'workspacePaneCollapsed' : ''].filter(Boolean).join(' ')}>
      {headerContent ? (
        <div className="paneHeader workspacePaneHeader">
          <div className="workspacePaneHeaderCopy">{headerContent}</div>
          <div className="workspacePaneHeaderActions">{pane.headerActions}</div>
        </div>
      ) : null}
      <div className={['paneScroll', pane.scrollClassName].filter(Boolean).join(' ')}>
        {collapsed ? null : pane.content}
      </div>
    </div>
  );
}

export function WorkspacePaneLayout({ workspaceId, className, left, center, right, bottom }: WorkspacePaneLayoutProps) {
  const frame = useWorkspaceFrame();
  const storageKey = `contenthead.workspace.panels.${workspaceId}`;
  const topPanes = useMemo(() => [left, center, right].filter((entry): entry is WorkspaceManagedPane => Boolean(entry)), [left, center, right]);
  const topPanelIds = useMemo(() => topPanes.map((pane) => pane.id), [topPanes]);
  const defaultTopSizes = useMemo<Record<string, number>>(
    () => topPanes.reduce((acc, pane) => ({ ...acc, [pane.id]: pane.defaultSize }), {}),
    [topPanes]
  );
  const defaultTopCollapsed = useMemo<Record<string, boolean>>(
    () => topPanes.reduce((acc, pane) => ({ ...acc, [pane.id]: false }), {}),
    [topPanes]
  );

  const [topCollapsed, setTopCollapsed] = useState<Record<string, boolean>>(() => {
    const persisted = loadPersistedState(storageKey);
    return { ...defaultTopCollapsed, ...(persisted?.topCollapsed ?? {}) };
  });
  const [topExpandedSizes, setTopExpandedSizes] = useState<Record<string, number>>(() => {
    const persisted = loadPersistedState(storageKey);
    return { ...defaultTopSizes, ...(persisted?.topExpandedSizes ?? {}) };
  });
  const [topSizes, setTopSizes] = useState<Record<string, number>>(() => {
    const persisted = loadPersistedState(storageKey);
    const merged = { ...defaultTopSizes, ...(persisted?.topSizes ?? {}) };
    return normalizeSizeMap(topPanelIds, merged, { ...defaultTopCollapsed, ...(persisted?.topCollapsed ?? {}) });
  });
  const [bottomCollapsed, setBottomCollapsed] = useState<boolean>(() => {
    const persisted = loadPersistedState(storageKey);
    return Boolean(persisted?.bottomCollapsed);
  });
  const [verticalTopSize, setVerticalTopSize] = useState<number>(() => {
    const persisted = loadPersistedState(storageKey);
    const stored = persisted?.verticalTopSize;
    if (typeof stored === 'number' && Number.isFinite(stored) && stored >= 20 && stored <= 95) {
      return stored;
    }
    return bottom ? Math.max(20, Math.min(95, 100 - bottom.defaultSize)) : 100;
  });
  const [bottomExpandedSize, setBottomExpandedSize] = useState<number>(() => {
    const persisted = loadPersistedState(storageKey);
    const stored = persisted?.bottomExpandedSize;
    if (typeof stored === 'number' && Number.isFinite(stored) && stored >= 5 && stored <= 80) {
      return stored;
    }
    return bottom?.defaultSize ?? 0;
  });

  useEffect(() => {
    const normalized = normalizeSizeMap(topPanelIds, topSizes, topCollapsed);
    if (JSON.stringify(normalized) !== JSON.stringify(topSizes)) {
      setTopSizes(normalized);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topCollapsed, topPanelIds.join('|')]);

  useEffect(() => {
    savePersistedState(storageKey, {
      topSizes,
      topCollapsed,
      topExpandedSizes,
      verticalTopSize,
      bottomCollapsed,
      bottomExpandedSize
    });
  }, [storageKey, topSizes, topCollapsed, topExpandedSizes, verticalTopSize, bottomCollapsed, bottomExpandedSize]);

  const toggleTopPanel = (panelId: string) => {
    const pane = topPanes.find((entry) => entry.id === panelId);
    if (!pane || pane.collapsible === false) {
      return;
    }

    setTopCollapsed((currentCollapsed) => {
      const nextCollapsed = !currentCollapsed[panelId];
      const updatedCollapsed = { ...currentCollapsed, [panelId]: nextCollapsed };

      if (nextCollapsed) {
        setTopExpandedSizes((currentExpanded) => ({
          ...currentExpanded,
          [panelId]: topSizes[panelId] && topSizes[panelId] > 0 ? topSizes[panelId] : pane.defaultSize
        }));
        setTopSizes((currentSizes) => normalizeSizeMap(topPanelIds, { ...currentSizes, [panelId]: 0 }, updatedCollapsed));
      } else {
        const restored = topExpandedSizes[panelId] && topExpandedSizes[panelId] > 0 ? topExpandedSizes[panelId] : pane.defaultSize;
        setTopSizes((currentSizes) => normalizeSizeMap(topPanelIds, { ...currentSizes, [panelId]: restored }, updatedCollapsed));
      }

      return updatedCollapsed;
    });
  };

  const toggleBottomPanel = () => {
    if (!bottom || bottom.collapsible === false) {
      return;
    }
    setBottomCollapsed((current) => {
      const next = !current;
      if (next) {
        const currentBottom = Math.max(5, 100 - verticalTopSize);
        setBottomExpandedSize(currentBottom);
        setVerticalTopSize(100);
      } else {
        const restoredBottom = Math.max(5, Math.min(80, bottomExpandedSize || bottom.defaultSize));
        setVerticalTopSize(Math.max(20, 100 - restoredBottom));
      }
      return next;
    });
  };

  const resetLayout = () => {
    setTopCollapsed(defaultTopCollapsed);
    setTopExpandedSizes(defaultTopSizes);
    setTopSizes(normalizeSizeMap(topPanelIds, defaultTopSizes, defaultTopCollapsed));
    setBottomCollapsed(false);
    setBottomExpandedSize(bottom?.defaultSize ?? 0);
    setVerticalTopSize(bottom ? Math.max(20, Math.min(95, 100 - bottom.defaultSize)) : 100);
  };

  const panelMenuModel = useMemo<NavMenuItem[]>(() => {
    const topItems = topPanes
      .filter((pane) => pane.collapsible !== false)
      .map<NavMenuItem>((pane) => ({
        label: `${topCollapsed[pane.id] ? 'Show' : 'Hide'} ${pane.label}`,
        icon: topCollapsed[pane.id] ? 'pi pi-eye' : 'pi pi-eye-slash',
        command: () => toggleTopPanel(pane.id)
      }));
    const bottomItems: NavMenuItem[] =
      bottom && bottom.collapsible !== false
        ? [
            {
              label: `${bottomCollapsed ? 'Show' : 'Hide'} ${bottom.label}`,
              icon: bottomCollapsed ? 'pi pi-eye' : 'pi pi-eye-slash',
              command: () => toggleBottomPanel()
            }
          ]
        : [];
    const separator = topItems.length > 0 || bottomItems.length > 0 ? [{ separator: true } satisfies NavMenuItem] : [];
    return [...topItems, ...bottomItems, ...separator, { label: 'Reset layout', icon: 'pi pi-replay', command: resetLayout }];
  }, [bottom, bottomCollapsed, topCollapsed, topPanes]);

  useEffect(() => {
    frame?.setPanelMenuModel(panelMenuModel);
    return () => frame?.setPanelMenuModel([]);
  }, [frame, panelMenuModel]);

  const topSplitter = (
    <Splitter
      className={['splitFill', 'workspaceSplitter', className].filter(Boolean).join(' ')}
      onResizeEnd={(event) => {
        const resized = (event.sizes as number[]) ?? [];
        if (resized.length !== topPanes.length) {
          return;
        }
        const nextSizes = topPanes.reduce<Record<string, number>>((acc, pane, index) => {
          if (topCollapsed[pane.id]) {
            return { ...acc, [pane.id]: 0 };
          }
          return { ...acc, [pane.id]: Math.max(0, resized[index] ?? 0) };
        }, {});
        setTopSizes(normalizeSizeMap(topPanelIds, nextSizes, topCollapsed));
      }}
    >
      {topPanes.map((pane) => {
        const isCollapsed = Boolean(topCollapsed[pane.id]);
        const size = isCollapsed ? 0 : (topSizes[pane.id] ?? pane.defaultSize);
        return (
          <SplitterPanel key={pane.id} size={size} minSize={isCollapsed ? 0 : pane.minSize}>
            {renderPane(pane, isCollapsed)}
          </SplitterPanel>
        );
      })}
    </Splitter>
  );

  if (!bottom) {
    return <section className="workspacePaneFill">{topSplitter}</section>;
  }

  if (bottomCollapsed) {
    return <section className="workspacePaneFill">{topSplitter}</section>;
  }

  return (
    <section className="workspacePaneFill">
      <Splitter
        className="splitFill workspaceSplitter workspaceSplitterVertical"
        layout="vertical"
        onResizeEnd={(event) => {
          const sizes = (event.sizes as number[]) ?? [];
          if (sizes.length !== 2) {
            return;
          }
          const nextTopSize = Math.max(20, Math.min(95, sizes[0] ?? verticalTopSize));
          setVerticalTopSize(nextTopSize);
          setBottomExpandedSize(Math.max(5, 100 - nextTopSize));
        }}
      >
        <SplitterPanel size={verticalTopSize} minSize={20}>
          {topSplitter}
        </SplitterPanel>
        <SplitterPanel size={Math.max(5, 100 - verticalTopSize)} minSize={5}>
          {renderPane(bottom, false)}
        </SplitterPanel>
      </Splitter>
    </section>
  );
}

export function WorkspacePanelToggleButton({
  paneId,
  onToggle,
  collapsed,
  label
}: {
  paneId: string;
  onToggle: (id: string) => void;
  collapsed: boolean;
  label: string;
}) {
  return (
    <Button
      text
      size="small"
      icon={collapsed ? 'pi pi-eye' : 'pi pi-eye-slash'}
      label={`${collapsed ? 'Show' : 'Hide'} ${label}`}
      onClick={() => onToggle(paneId)}
    />
  );
}
