import { useEffect, useMemo, useState } from 'react';
import { TabPanel, TabView } from 'primereact/tabview';
import { Dialog } from 'primereact/dialog';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

import { Button, Checkbox, TextInput } from '../../../ui/atoms';

import { createAdminSdk } from '../../../lib/sdk';

export type ContentLinkValue = {
  kind: 'internal' | 'external';
  url?: string;
  contentItemId?: number;
  routeSlug?: string;
  anchor?: string;
  text?: string;
  target?: '_self' | '_blank';
};

type RouteRow = { contentItemId: number; slug: string; marketCode: string; localeCode: string; isCanonical?: boolean };

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
  const [anchor, setAnchor] = useState(value?.anchor ?? '');
  const [linkText, setLinkText] = useState(value?.text ?? '');
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
    return routes.filter(
      (entry) =>
        entry.slug.toLowerCase().includes(text) ||
        `${entry.marketCode}/${entry.localeCode}`.toLowerCase().includes(text) ||
        String(entry.contentItemId).includes(text)
    );
  }, [routes, query]);

  return (
    <Dialog header="Select Link" visible={visible} onHide={onHide} className="w-11 lg:w-10 xl:w-9">
      <TabView>
        <TabPanel header="Internal">
          <div className="form-row">
            <label>Find route</label>
            <TextInput value={query} onChange={(next) => setQuery(next)} placeholder="slug or content item id" />
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
                    const hash = anchor.trim() ? `#${anchor.trim().replace(/^#/, '')}` : '';
                    onApply({
                      kind: 'internal',
                      contentItemId: row.contentItemId,
                      routeSlug: row.slug,
                      url: `/${row.slug}${hash}`,
                      ...(anchor.trim() ? { anchor: anchor.trim() } : {}),
                      ...(linkText.trim() ? { text: linkText.trim() } : {}),
                      target: '_self'
                    });
                    onHide();
                  }}
                />
              )}
            />
          </DataTable>
          <div className="form-grid mt-3">
            <div className="form-row">
              <label>Link text (optional)</label>
              <TextInput value={linkText} onChange={(next) => setLinkText(next)} placeholder="Use selected text if empty" />
            </div>
            <div className="form-row">
              <label>Anchor (optional)</label>
              <TextInput value={anchor} onChange={(next) => setAnchor(next)} placeholder="section-id" />
            </div>
          </div>
        </TabPanel>
        <TabPanel header="External">
          <div className="form-row">
            <label>URL</label>
            <TextInput value={externalUrl} onChange={(next) => setExternalUrl(next)} placeholder="https://example.com" />
            {!/^https?:\/\//i.test(externalUrl) ? <small className="error-text">Use http:// or https://</small> : null}
          </div>
          <div className="form-row">
            <label>Link text (optional)</label>
            <TextInput value={linkText} onChange={(next) => setLinkText(next)} placeholder="Use selected text if empty" />
          </div>
          <label>
            <Checkbox checked={openInNewTab} onChange={(next) => setOpenInNewTab(next)} /> Open in new tab
          </label>
          <div className="inline-actions mt-3">
            <Button
              label="Apply"
              onClick={() => {
                if (!/^https?:\/\//i.test(externalUrl)) {
                  return;
                }
                onApply({
                  kind: 'external',
                  url: externalUrl,
                  ...(linkText.trim() ? { text: linkText.trim() } : {}),
                  target: openInNewTab ? '_blank' : '_self'
                });
                onHide();
              }}
            />
          </div>
        </TabPanel>
      </TabView>
    </Dialog>
  );
}

