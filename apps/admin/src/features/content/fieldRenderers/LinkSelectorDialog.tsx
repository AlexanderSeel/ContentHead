import { useEffect, useMemo, useState } from 'react';
import { TabPanel, TabView } from 'primereact/tabview';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';

import { createAdminSdk } from '../../../lib/sdk';

export type ContentLinkValue = {
  kind: 'internal' | 'external';
  url?: string;
  contentItemId?: number;
  text?: string;
  target?: '_self' | '_blank';
};

type RouteRow = { contentItemId: number; slug: string; marketCode: string; localeCode: string };

export function LinkSelectorDialog({
  visible,
  token,
  siteId,
  value,
  onHide,
  onApply
}: {
  visible: boolean;
  token: string | null;
  siteId: number;
  value: ContentLinkValue | null;
  onHide: () => void;
  onApply: (value: ContentLinkValue) => void;
}) {
  const sdk = useMemo(() => createAdminSdk(token), [token]);
  const [query, setQuery] = useState('');
  const [routes, setRoutes] = useState<RouteRow[]>([]);
  const [externalUrl, setExternalUrl] = useState(value?.url ?? 'https://');
  const [openInNewTab, setOpenInNewTab] = useState(value?.target === '_blank');

  useEffect(() => {
    if (!visible) {
      return;
    }
    sdk
      .listRoutes({ siteId, marketCode: null, localeCode: null })
      .then((res) => setRoutes((res.listRoutes ?? []) as RouteRow[]))
      .catch(() => setRoutes([]));
  }, [visible, sdk, siteId]);

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) {
      return routes.slice(0, 100);
    }
    return routes.filter((entry) => entry.slug.toLowerCase().includes(text) || String(entry.contentItemId).includes(text));
  }, [routes, query]);

  return (
    <Dialog header="Select Link" visible={visible} onHide={onHide} style={{ width: '48rem' }}>
      <TabView>
        <TabPanel header="Internal">
          <div className="form-row">
            <label>Find route</label>
            <InputText value={query} onChange={(event) => setQuery(event.target.value)} placeholder="slug or content item id" />
          </div>
          <DataTable value={filtered} size="small">
            <Column field="contentItemId" header="Item" />
            <Column field="slug" header="Slug" />
            <Column field="marketCode" header="Market" />
            <Column field="localeCode" header="Locale" />
            <Column
              header="Select"
              body={(row: RouteRow) => (
                <Button
                  text
                  label="Use"
                  onClick={() => {
                    onApply({ kind: 'internal', contentItemId: row.contentItemId, url: `/${row.slug}`, target: '_self' });
                    onHide();
                  }}
                />
              )}
            />
          </DataTable>
        </TabPanel>
        <TabPanel header="External">
          <div className="form-row">
            <label>URL</label>
            <InputText value={externalUrl} onChange={(event) => setExternalUrl(event.target.value)} placeholder="https://example.com" />
            {!/^https?:\/\//i.test(externalUrl) ? <small className="error-text">Use http:// or https://</small> : null}
          </div>
          <label>
            <Checkbox checked={openInNewTab} onChange={(event) => setOpenInNewTab(Boolean(event.checked))} /> Open in new tab
          </label>
          <div className="inline-actions" style={{ marginTop: '0.75rem' }}>
            <Button
              label="Apply"
              onClick={() => {
                if (!/^https?:\/\//i.test(externalUrl)) {
                  return;
                }
                onApply({ kind: 'external', url: externalUrl, target: openInNewTab ? '_blank' : '_self' });
                onHide();
              }}
            />
          </div>
        </TabPanel>
      </TabView>
    </Dialog>
  );
}
