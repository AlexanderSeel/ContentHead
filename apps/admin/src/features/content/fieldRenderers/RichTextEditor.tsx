import { useMemo, useRef, useState } from 'react';
import { Editor } from 'primereact/editor';

import { AssetPickerDialog } from '../../../components/inputs/AssetPickerDialog';
import { getApiBaseUrl } from '../../../lib/api';
import { createAdminSdk } from '../../../lib/sdk';
import {
  DEFAULT_RICH_TEXT_FEATURES,
  FULL_RICH_TEXT_FEATURES,
  type RichTextFeature
} from '../../schema/fieldValidationUi';
import { LinkSelectorDialog, type ContentLinkValue } from './LinkSelectorDialog';
import { sanitizeRichTextHtml } from './richTextSanitize';

const has = (features: Set<RichTextFeature>, feature: RichTextFeature) => features.has(feature);
const TABLE_HTML =
  '<table><tbody><tr><td>&nbsp;</td><td>&nbsp;</td></tr><tr><td>&nbsp;</td><td>&nbsp;</td></tr></tbody></table><p><br/></p>';

type QuillRange = { index: number; length: number };

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function buildFormats(features: RichTextFeature[]): string[] {
  const enabled = new Set(features);
  const formats: string[] = [];
  if (has(enabled, 'bold')) {
    formats.push('bold');
  }
  if (has(enabled, 'italic')) {
    formats.push('italic');
  }
  if (has(enabled, 'underline')) {
    formats.push('underline');
  }
  if (has(enabled, 'strike')) {
    formats.push('strike');
  }
  if (has(enabled, 'h1') || has(enabled, 'h2') || has(enabled, 'h3')) {
    formats.push('header');
  }
  if (has(enabled, 'list') || has(enabled, 'ordered')) {
    formats.push('list');
  }
  if (has(enabled, 'align')) {
    formats.push('align');
  }
  if (has(enabled, 'link')) {
    formats.push('link');
  }
  if (has(enabled, 'quote')) {
    formats.push('blockquote');
  }
  if (has(enabled, 'code')) {
    formats.push('code-block');
  }
  if (has(enabled, 'image')) {
    formats.push('image');
  }
  return formats;
}

function buildHeader(features: RichTextFeature[]) {
  const enabled = new Set(features);
  const headingOptions = [
    has(enabled, 'h1') ? <option key="h1" value="1" /> : null,
    has(enabled, 'h2') ? <option key="h2" value="2" /> : null,
    has(enabled, 'h3') ? <option key="h3" value="3" /> : null
  ].filter(Boolean);

  return (
    <>
      {headingOptions.length > 0 ? (
        <span className="ql-formats">
          <select className="ql-header" defaultValue="">
            <option value="" />
            {headingOptions}
          </select>
        </span>
      ) : null}
      {has(enabled, 'align') ? (
        <span className="ql-formats">
          <select className="ql-align" defaultValue="">
            <option value="" />
            <option value="center" />
            <option value="right" />
            <option value="justify" />
          </select>
        </span>
      ) : null}
      <span className="ql-formats">
        {has(enabled, 'bold') ? <button type="button" className="ql-bold" /> : null}
        {has(enabled, 'italic') ? <button type="button" className="ql-italic" /> : null}
        {has(enabled, 'underline') ? <button type="button" className="ql-underline" /> : null}
        {has(enabled, 'strike') ? <button type="button" className="ql-strike" /> : null}
        {has(enabled, 'quote') ? <button type="button" className="ql-blockquote" /> : null}
        {has(enabled, 'code') ? <button type="button" className="ql-code-block" /> : null}
      </span>
      <span className="ql-formats">
        {has(enabled, 'list') ? <button type="button" className="ql-list" value="bullet" /> : null}
        {has(enabled, 'ordered') ? <button type="button" className="ql-list" value="ordered" /> : null}
        {has(enabled, 'link') ? <button type="button" className="ql-cms-link">Link</button> : null}
        {has(enabled, 'table') ? <button type="button" className="ql-table">Tbl</button> : null}
        {has(enabled, 'image') ? <button type="button" className="ql-cms-asset">Asset</button> : null}
      </span>
      <span className="ql-formats">
        {has(enabled, 'undo') ? <button type="button" className="ql-undo">Undo</button> : null}
        {has(enabled, 'redo') ? <button type="button" className="ql-redo">Redo</button> : null}
      </span>
    </>
  );
}

function buildLinkHtml(value: ContentLinkValue, fallbackText: string): string {
  const text = escapeHtml(value.text?.trim() || fallbackText || value.url || 'Link');
  const href = escapeHtml(value.url ?? '#');
  if (value.kind === 'internal') {
    return `<a href="${href}" data-cms-link-kind="internal" data-cms-content-item-id="${value.contentItemId ?? ''}" data-cms-route="${escapeHtml(value.routeSlug ?? '')}" data-cms-anchor="${escapeHtml(value.anchor ?? '')}" target="_self">${text}</a>`;
  }
  return `<a href="${href}" data-cms-link-kind="external" target="${value.target ?? '_self'}" rel="${value.target === '_blank' ? 'noreferrer' : ''}">${text}</a>`;
}

export function RichTextEditor({
  value,
  onChange,
  features,
  readOnly,
  token,
  siteId
}: {
  value: string;
  onChange: (value: string) => void;
  features?: RichTextFeature[] | null;
  readOnly?: boolean;
  token?: string | null;
  siteId?: number;
}) {
  const sdk = useMemo(() => createAdminSdk(token ?? null), [token]);
  const enabled = features && features.length > 0 ? features : DEFAULT_RICH_TEXT_FEATURES;
  const toolbarPreset = enabled.length === 0 ? FULL_RICH_TEXT_FEATURES : enabled;
  const headerTemplate = useMemo(() => buildHeader(toolbarPreset), [toolbarPreset]);
  const formats = useMemo(() => buildFormats(toolbarPreset), [toolbarPreset]);
  const quillRef = useRef<any>(null);
  const [linkDialogVisible, setLinkDialogVisible] = useState(false);
  const [assetDialogVisible, setAssetDialogVisible] = useState(false);
  const [selectionRange, setSelectionRange] = useState<QuillRange | null>(null);

  const insertHtmlAtSelection = (html: string, fallbackText = '') => {
    const quill = quillRef.current;
    if (!quill) {
      return;
    }
    const range = selectionRange ?? quill.getSelection(true);
    const index = typeof range?.index === 'number' ? range.index : quill.getLength();
    const length = typeof range?.length === 'number' ? range.length : 0;
    if (length > 0) {
      quill.deleteText(index, length, 'user');
    }
    quill.clipboard.dangerouslyPasteHTML(index, html || escapeHtml(fallbackText), 'user');
    quill.setSelection(index + fallbackText.length, 0, 'user');
  };

  return (
    <>
      <Editor
        className="ch-richtext-editor"
        value={value}
        onTextChange={(event) => onChange(sanitizeRichTextHtml(event.htmlValue ?? ''))}
        headerTemplate={readOnly ? null : headerTemplate}
        formats={formats}
        onLoad={(quill) => {
          quillRef.current = quill;
          const toolbar = quill?.getModule?.('toolbar');
          if (!toolbar) {
            return;
          }
          toolbar.addHandler('undo', () => quill.history.undo());
          toolbar.addHandler('redo', () => quill.history.redo());
          toolbar.addHandler('table', () => {
            const range = quill.getSelection(true);
            const insertAt = typeof range?.index === 'number' ? range.index : quill.getLength();
            quill.clipboard.dangerouslyPasteHTML(insertAt, TABLE_HTML, 'user');
          });
          toolbar.addHandler('cms-link', () => {
            const range = quill.getSelection(true);
            if (range && typeof range.index === 'number' && typeof range.length === 'number') {
              setSelectionRange({ index: range.index, length: range.length });
            } else {
              setSelectionRange(null);
            }
            setLinkDialogVisible(true);
          });
          toolbar.addHandler('cms-asset', () => {
            const range = quill.getSelection(true);
            if (range && typeof range.index === 'number' && typeof range.length === 'number') {
              setSelectionRange({ index: range.index, length: range.length });
            } else {
              setSelectionRange(null);
            }
            setAssetDialogVisible(true);
          });
        }}
        readOnly={readOnly}
      />
      {token && siteId ? (
        <LinkSelectorDialog
          visible={linkDialogVisible}
          token={token}
          siteId={siteId}
          value={null}
          onHide={() => setLinkDialogVisible(false)}
          onApply={(nextLink) => {
            const fallbackText = nextLink.text?.trim() || nextLink.url || 'Link';
            insertHtmlAtSelection(buildLinkHtml(nextLink, fallbackText), fallbackText);
            setLinkDialogVisible(false);
          }}
        />
      ) : null}
      {token && siteId ? (
        <AssetPickerDialog
          visible={assetDialogVisible}
          token={token}
          siteId={siteId}
          selected={[]}
          onHide={() => setAssetDialogVisible(false)}
          onApply={(assetIds) => {
            const assetId = assetIds[0];
            if (!assetId) {
              setAssetDialogVisible(false);
              return;
            }
            sdk
              .getAsset({ id: assetId })
              .then((res) => {
                const asset = res.getAsset;
                const label = asset?.title ?? asset?.originalName ?? `Asset ${assetId}`;
                if ((asset?.mimeType ?? '').startsWith('image/')) {
                  const alt = escapeHtml(asset?.altText ?? label);
                  insertHtmlAtSelection(
                    `<img src="${getApiBaseUrl()}/assets/${assetId}/rendition/medium" alt="${alt}" data-cms-asset-id="${assetId}" />`,
                    label
                  );
                } else {
                  insertHtmlAtSelection(
                    `<a href="${getApiBaseUrl()}/assets/${assetId}" data-cms-asset-id="${assetId}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>`,
                    label
                  );
                }
              })
              .finally(() => setAssetDialogVisible(false));
          }}
        />
      ) : null}
    </>
  );
}
