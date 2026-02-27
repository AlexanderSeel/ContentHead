import { useMemo, useState } from 'react';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dropdown } from 'primereact/dropdown';
import { Slider } from 'primereact/slider';
import { Tag } from 'primereact/tag';

import { useUi } from '../../app/UiContext';
import { getLayoutStorageOverview, resetAllLayoutStorage, resetLayoutStorageKey, type LayoutStorageEntry } from '../../lib/layoutSettings';
import { WorkspaceBody, WorkspaceHeader, WorkspacePage } from '../../ui/molecules';

export function PreferencesPage() {
  const { theme, themes, setTheme, scale, setScale, confirm, toast } = useUi();
  const [layoutEntries, setLayoutEntries] = useState<LayoutStorageEntry[]>(() => getLayoutStorageOverview());
  const customizedCount = useMemo(() => layoutEntries.filter((entry) => entry.exists).length, [layoutEntries]);

  const refreshLayoutEntries = () => setLayoutEntries(getLayoutStorageOverview());

  const resetLayout = async (entry: LayoutStorageEntry) => {
    const accepted = await confirm({
      header: 'Reset Layout',
      message: `Reset saved layout for "${entry.section}"?`,
      acceptLabel: 'Reset',
      rejectLabel: 'Cancel'
    });
    if (!accepted) {
      return;
    }
    resetLayoutStorageKey(entry.storageKey);
    refreshLayoutEntries();
    toast({ severity: 'success', summary: `Layout reset for ${entry.section}` }, 'settings/preferences');
  };

  const resetAllLayouts = async () => {
    const accepted = await confirm({
      header: 'Reset All Layouts',
      message: 'Reset all saved panel and splitter layouts?',
      acceptLabel: 'Reset All',
      rejectLabel: 'Cancel'
    });
    if (!accepted) {
      return;
    }
    const removedCount = resetAllLayoutStorage();
    refreshLayoutEntries();
    toast(
      { severity: 'success', summary: `Reset ${removedCount} saved layout${removedCount === 1 ? '' : 's'}` },
      'settings/preferences'
    );
  };

  return (
    <WorkspacePage>
      <WorkspaceHeader title="Preferences" subtitle="Theme and UI scale settings for your admin workspace." />
      <WorkspaceBody>
        <section className="content-card pane w-full lg:w-8">
          <div className="form-grid">
            <div className="form-row">
              <label>Theme</label>
              <Dropdown
                value={theme}
                options={themes}
                optionLabel="label"
                optionValue="value"
                onChange={(event) => setTheme(String(event.value))}
                placeholder="Theme"
                filter
              />
            </div>
            <div className="form-row">
              <label>Scale: {scale}px</label>
              <Slider value={scale} min={12} max={16} step={1} onChange={(event) => setScale(Number(event.value ?? 14))} />
            </div>
          </div>
        </section>

        <section className="content-card pane w-full">
          <div className="inline-actions justify-content-between mb-3">
            <div className="muted">
              Saved layouts: {customizedCount}
            </div>
            <div className="inline-actions">
              <Button label="Refresh" severity="secondary" onClick={refreshLayoutEntries} />
              <Button
                label="Reset all layouts"
                severity="danger"
                onClick={() => void resetAllLayouts()}
                disabled={customizedCount === 0}
              />
            </div>
          </div>

          <DataTable value={layoutEntries} size="small" dataKey="storageKey" emptyMessage="No layout settings found.">
            <Column field="section" header="Section" />
            <Column field="summary" header="State" />
            <Column
              header="Status"
              body={(entry: LayoutStorageEntry) => (
                <Tag value={entry.exists ? 'Customized' : 'Default'} severity={entry.exists ? 'info' : 'success'} />
              )}
              style={{ width: '9rem' }}
            />
            <Column
              header="Actions"
              body={(entry: LayoutStorageEntry) => (
                <Button
                  label="Reset"
                  text
                  severity="danger"
                  onClick={() => void resetLayout(entry)}
                  disabled={!entry.exists}
                />
              )}
              style={{ width: '7rem' }}
            />
          </DataTable>
          <small className="muted mt-2">Reset takes effect the next time you open the related section.</small>
        </section>
      </WorkspaceBody>
    </WorkspacePage>
  );
}

