import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Column } from 'primereact/column';
import { ContextMenu } from 'primereact/contextmenu';
import { DataTable } from 'primereact/datatable';
import { Splitter, SplitterPanel } from 'primereact/splitter';

import { Button, Checkbox, TextInput } from '../../ui/atoms';

import { createAdminSdk } from '../../lib/sdk';
import { useAuth } from '../../app/AuthContext';
import { useAdminContext } from '../../app/AdminContext';
import { useUi } from '../../app/UiContext';
import { MarketLocalePicker } from '../../components/inputs/MarketLocalePicker';
import { SlugEditor } from '../../components/inputs/SlugEditor';
import { ContentReferencePicker } from '../../components/inputs/ContentReferencePicker';
import { CommandMenuButton } from '../../ui/commands/CommandMenuButton';
import { commandRegistry } from '../../ui/commands/registry';
import { toTieredMenuItems } from '../../ui/commands/menuModel';
import type { Command, CommandContext } from '../../ui/commands/types';
import { downloadCsv, downloadJson, routeStartsWith } from '../../ui/commands/utils';
import { PaneRoot, PaneScroll, WorkspaceActionBar, WorkspaceBody, WorkspaceHeader, WorkspacePage } from '../../ui/molecules';

type Route = { id: number; contentItemId: number; marketCode: string; localeCode: string; slug: string; isCanonical: boolean };

type RoutesPageHeaderContext = CommandContext & {
  routes: Route[];
  refresh: () => Promise<void>;
};

type RoutesPageRowContext = CommandContext & {
  row: Route;
  editRow: (row: Route) => void;
  duplicateRow: (row: Route) => void;
  deleteRow: (row: Route) => Promise<void>;
};

const routesHeaderCommands: Command<RoutesPageHeaderContext>[] = [
  {
    id: 'routes.export.csv',
    label: 'Export CSV',
    icon: 'pi pi-file-export',
    group: 'Export',
    visible: (ctx) => routeStartsWith(ctx.route, '/content/routes'),
    enabled: (ctx) => ctx.routes.length > 0,
    run: (ctx) => {
      downloadCsv(
        `routes-site-${ctx.siteId ?? 'unknown'}.csv`,
        ['id', 'contentItemId', 'marketCode', 'localeCode', 'slug', 'isCanonical'],
        ctx.routes.map((entry) => [entry.id, entry.contentItemId, entry.marketCode, entry.localeCode, entry.slug, entry.isCanonical ? 'true' : 'false'])
      );
      ctx.toast?.({ severity: 'success', summary: 'Routes CSV exported' });
    }
  },
  {
    id: 'routes.export.json',
    label: 'Export JSON',
    icon: 'pi pi-download',
    group: 'Export',
    visible: (ctx) => routeStartsWith(ctx.route, '/content/routes'),
    enabled: (ctx) => ctx.routes.length > 0,
    run: (ctx) => {
      downloadJson(`routes-site-${ctx.siteId ?? 'unknown'}.json`, ctx.routes);
      ctx.toast?.({ severity: 'success', summary: 'Routes JSON exported' });
    }
  },
  {
    id: 'routes.advanced.refresh',
    label: 'Refresh',
    icon: 'pi pi-refresh',
    group: 'Advanced',
    visible: (ctx) => routeStartsWith(ctx.route, '/content/routes'),
    run: (ctx) => ctx.refresh()
  }
];

const routesRowCommands: Command<RoutesPageRowContext>[] = [
  {
    id: 'routes.row.open',
    label: 'Edit',
    icon: 'pi pi-pencil',
    visible: (ctx) => routeStartsWith(ctx.route, '/content/routes'),
    run: (ctx) => ctx.editRow(ctx.row)
  },
  {
    id: 'routes.row.duplicate',
    label: 'Duplicate',
    icon: 'pi pi-copy',
    visible: (ctx) => routeStartsWith(ctx.route, '/content/routes'),
    run: (ctx) => ctx.duplicateRow(ctx.row)
  },
  {
    id: 'routes.row.delete',
    label: 'Delete',
    icon: 'pi pi-trash',
    danger: true,
    requiresConfirm: true,
    confirmText: 'Delete this route?',
    visible: (ctx) => routeStartsWith(ctx.route, '/content/routes'),
    run: (ctx) => ctx.deleteRow(ctx.row)
  }
];

commandRegistry.registerCoreCommands([{ placement: 'pageHeaderOverflow', commands: routesHeaderCommands }]);
commandRegistry.registerCoreCommands([{ placement: 'rowOverflow', commands: routesRowCommands }]);

export function RoutesPage() {
  const { token } = useAuth();
  const location = useLocation();
  const sdk = useMemo(() => createAdminSdk(token), [token]);
  const { toast, confirm } = useUi();
  const { siteId, combos } = useAdminContext();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState<Route>({ id: 0, contentItemId: 0, marketCode: 'US', localeCode: 'en-US', slug: '', isCanonical: true });
  const [selectedContextRoute, setSelectedContextRoute] = useState<Route | null>(null);
  const rowContextMenuRef = useRef<ContextMenu>(null);

  const refresh = async () => {
    const routesRes = await sdk.listRoutes({ siteId, marketCode: null, localeCode: null });
    setRoutes((routesRes.listRoutes ?? []) as Route[]);
  };

  useEffect(() => {
    refresh().catch(() => undefined);
  }, [siteId]);

  const baseContext: CommandContext = {
    route: location.pathname,
    siteId,
    selectedContentItemId: null,
    toast,
    confirm
  };

  const headerContext: RoutesPageHeaderContext = {
    ...baseContext,
    routes,
    refresh
  };

  const headerOverflowCommands = commandRegistry.getCommands(headerContext, 'pageHeaderOverflow');
  const filteredRoutes = routes.filter((entry) => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return true;
    }
    return entry.slug.toLowerCase().includes(query) || String(entry.contentItemId).includes(query);
  });

  const rowContextMenuItems = selectedContextRoute
    ? toTieredMenuItems(
        commandRegistry.getCommands(
          {
            ...baseContext,
            row: selectedContextRoute,
            editRow: setDraft,
            duplicateRow: (row) => setDraft({ ...row, id: 0, slug: `${row.slug}-copy` }),
            deleteRow: async (row) => {
              await sdk.deleteRoute({ id: row.id });
              await refresh();
              toast({ severity: 'success', summary: `Route #${row.id} deleted` });
            }
          } as RoutesPageRowContext,
          'rowOverflow'
        ),
        {
          ...baseContext,
          row: selectedContextRoute,
          editRow: setDraft,
          duplicateRow: (row) => setDraft({ ...row, id: 0, slug: `${row.slug}-copy` }),
          deleteRow: async (row) => {
            await sdk.deleteRoute({ id: row.id });
            await refresh();
            toast({ severity: 'success', summary: `Route #${row.id} deleted` });
          }
        } as RoutesPageRowContext
      )
    : [];

  return (
    <WorkspacePage>
      <WorkspaceHeader title="Routes" subtitle="Route bindings per market/locale" />
      <WorkspaceActionBar
        primary={
          <>
            <TextInput placeholder="Search slug or item id" value={search} onChange={(next) => setSearch(next)} />
            <Button label="Refresh" onClick={() => refresh()} />
          </>
        }
        overflow={<CommandMenuButton commands={headerOverflowCommands} context={headerContext} buttonLabel="" buttonIcon="pi pi-ellipsis-h" text />}
      />
      <WorkspaceBody>
        <ContextMenu ref={rowContextMenuRef} model={rowContextMenuItems} />
        <Splitter className="splitFill">
          <SplitterPanel size={62} minSize={38}>
            <PaneRoot className="content-card">
              <PaneScroll>
                <DataTable
                  value={filteredRoutes}
                  size="small"
                  onContextMenu={(event) => {
                    setSelectedContextRoute(event.data as Route);
                    window.requestAnimationFrame(() => rowContextMenuRef.current?.show(event.originalEvent));
                  }}
                >
                  <Column field="id" header="ID" />
                  <Column field="contentItemId" header="Item" />
                  <Column field="marketCode" header="Market" />
                  <Column field="localeCode" header="Locale" />
                  <Column field="slug" header="Slug" />
                  <Column field="isCanonical" header="Canonical" body={(row: Route) => (row.isCanonical ? 'Yes' : 'No')} />
                  <Column
                    header="Actions"
                    body={(row: Route) => {
                      const rowContext: RoutesPageRowContext = {
                        ...baseContext,
                        row,
                        editRow: setDraft,
                        duplicateRow: (entry) => setDraft({ ...entry, id: 0, slug: `${entry.slug}-copy` }),
                        deleteRow: async (entry) => {
                          await sdk.deleteRoute({ id: entry.id });
                          await refresh();
                          toast({ severity: 'success', summary: `Route #${entry.id} deleted` });
                        }
                      };
                      return <CommandMenuButton commands={commandRegistry.getCommands(rowContext, 'rowOverflow')} context={rowContext} buttonLabel="" buttonIcon="pi pi-ellipsis-h" text />;
                    }}
                  />
                </DataTable>
              </PaneScroll>
            </PaneRoot>
          </SplitterPanel>
          <SplitterPanel size={38} minSize={24}>
            <PaneRoot className="content-card">
              <PaneScroll>
                <div className="form-grid">
                  <ContentReferencePicker token={token} siteId={siteId} value={draft.contentItemId || null} onChange={(value) => setDraft((prev) => ({ ...prev, contentItemId: value ?? 0 }))} />
                  <MarketLocalePicker
                    combos={combos}
                    marketCode={draft.marketCode}
                    localeCode={draft.localeCode}
                    onChange={(value) => setDraft((prev) => ({ ...prev, ...value }))}
                  />
                  <SlugEditor value={draft.slug} onChange={(value) => setDraft((prev) => ({ ...prev, slug: value }))} />
                  <label><Checkbox checked={draft.isCanonical} onChange={(next) => setDraft((prev) => ({ ...prev, isCanonical: next }))} /> Canonical</label>
                  <Button
                    label="Save Route"
                    onClick={() =>
                      sdk
                        .upsertRoute({
                          ...(draft.id ? { id: draft.id } : {}),
                          siteId,
                          contentItemId: draft.contentItemId,
                          marketCode: draft.marketCode,
                          localeCode: draft.localeCode,
                          slug: draft.slug,
                          isCanonical: draft.isCanonical
                        })
                        .then(() => refresh())
                    }
                  />
                </div>
              </PaneScroll>
            </PaneRoot>
          </SplitterPanel>
        </Splitter>
      </WorkspaceBody>
    </WorkspacePage>
  );
}
