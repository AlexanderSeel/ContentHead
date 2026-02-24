import { useEffect, useMemo, useState } from 'react';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { InputSwitch } from 'primereact/inputswitch';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';

import { useAdminContext } from '../../app/AdminContext';
import { useAuth } from '../../app/AuthContext';
import { createAdminSdk } from '../../lib/sdk';
import { WorkspaceActionBar, WorkspaceBody, WorkspaceHeader, WorkspacePage } from '../../ui/molecules';
import {
  resolveComponentRegistry,
  type ComponentTypeSetting,
  type ResolvedComponentRegistryEntry
} from '../content/components/componentRegistry';

type ComponentTypeSettingRow = {
  siteId?: number | null;
  componentTypeId?: string | null;
  enabled?: boolean | null;
  groupName?: string | null;
};

export function ComponentRegistryPage() {
  const { token } = useAuth();
  const sdk = useMemo(() => createAdminSdk(token), [token]);
  const { siteId } = useAdminContext();
  const [settings, setSettings] = useState<ComponentTypeSetting[]>([]);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  const refresh = async () => {
    const result = await sdk.listComponentTypeSettings({ siteId });
    const rows = (result.listComponentTypeSettings ?? []) as ComponentTypeSettingRow[];
    setSettings(
      rows
        .filter((row) => typeof row.componentTypeId === 'string')
        .map((row) => ({
          componentTypeId: row.componentTypeId as string,
          enabled: Boolean(row.enabled ?? true),
          groupName: row.groupName ?? null
        }))
    );
  };

  useEffect(() => {
    refresh().catch((error: unknown) => setStatus(String(error)));
  }, [siteId]);

  const rows = useMemo(() => resolveComponentRegistry(settings), [settings]);
  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return rows;
    }
    return rows.filter((entry) =>
      entry.id.toLowerCase().includes(query) ||
      entry.label.toLowerCase().includes(query) ||
      entry.groupName.toLowerCase().includes(query)
    );
  }, [rows, search]);

  const saveSetting = async (
    entry: ResolvedComponentRegistryEntry,
    patch: Partial<Pick<ComponentTypeSetting, 'enabled' | 'groupName'>>
  ) => {
    const nextEnabled = patch.enabled ?? entry.enabled;
    const nextGroupName = patch.groupName ?? entry.groupName;
    await sdk.upsertComponentTypeSetting({
      siteId,
      componentTypeId: entry.id,
      enabled: nextEnabled,
      groupName: nextGroupName,
      by: 'admin'
    });
    await refresh();
  };

  return (
    <WorkspacePage>
      <WorkspaceHeader
        title="Component Registry"
        subtitle="Manage available component types for build and authoring."
      />
      <WorkspaceActionBar
        primary={<Button label="Refresh" onClick={() => refresh().catch((error: unknown) => setStatus(String(error)))} />}
      />
      <WorkspaceBody>
        <section className="content-card pane paneScroll">
        <div className="table-toolbar">
          <InputText
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search component types"
          />
        </div>
        <DataTable value={filteredRows} size="small" paginator rows={12}>
          <Column field="id" header="ID" style={{ width: '12rem' }} />
          <Column
            header="Type"
            body={(entry: ResolvedComponentRegistryEntry) => (
              <div>
                <strong>{entry.label}</strong>
                <div className="muted">{entry.description}</div>
              </div>
            )}
          />
          <Column
            field="groupName"
            header="Group"
            body={(entry: ResolvedComponentRegistryEntry) => (
              <InputText
                value={entry.groupName}
                onChange={(event) => {
                  const groupName = event.target.value;
                  setSettings((prev) => {
                    const map = new Map(prev.map((item) => [item.componentTypeId, item]));
                    map.set(entry.id, {
                      componentTypeId: entry.id,
                      enabled: entry.enabled,
                      groupName
                    });
                    return Array.from(map.values());
                  });
                }}
                onBlur={() => saveSetting(entry, { groupName: entry.groupName }).catch((error: unknown) => setStatus(String(error)))}
                placeholder="Group"
              />
            )}
            style={{ width: '14rem' }}
          />
          <Column
            header="Status"
            body={(entry: ResolvedComponentRegistryEntry) => (
              <Tag value={entry.enabled ? 'Enabled' : 'Disabled'} severity={entry.enabled ? 'success' : 'danger'} />
            )}
            style={{ width: '8rem' }}
          />
          <Column
            header="Enabled"
            body={(entry: ResolvedComponentRegistryEntry) => (
              <InputSwitch
                checked={entry.enabled}
                onChange={(event) =>
                  saveSetting(entry, { enabled: Boolean(event.value) }).catch((error: unknown) => setStatus(String(error)))
                }
              />
            )}
            style={{ width: '7rem' }}
          />
        </DataTable>
        </section>
      </WorkspaceBody>
      {status ? <div className="status-panel"><pre>{status}</pre></div> : null}
    </WorkspacePage>
  );
}
