import { useMemo, useRef, useState } from 'react';
import { Editor } from 'primereact/editor';

import { DEFAULT_RICH_TEXT_FEATURES, type RichTextFeature } from '../../schema/fieldValidationUi';
import { LinkSelectorDialog, type ContentLinkValue } from './LinkSelectorDialog';

const has = (features: Set<RichTextFeature>, feature: RichTextFeature) => features.has(feature);
const TABLE_HTML =
  '<table><tbody><tr><td>&nbsp;</td><td>&nbsp;</td></tr><tr><td>&nbsp;</td><td>&nbsp;</td></tr></tbody></table><p><br/></p>';

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
  if (has(enabled, 'h1') || has(enabled, 'h2')) {
    formats.push('header');
  }
  if (has(enabled, 'list') || has(enabled, 'ordered')) {
    formats.push('list');
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
    has(enabled, 'h2') ? <option key="h2" value="2" /> : null
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
      <span className="ql-formats">
        {has(enabled, 'bold') ? <button type="button" className="ql-bold" /> : null}
        {has(enabled, 'italic') ? <button type="button" className="ql-italic" /> : null}
        {has(enabled, 'underline') ? <button type="button" className="ql-underline" /> : null}
        {has(enabled, 'quote') ? <button type="button" className="ql-blockquote" /> : null}
        {has(enabled, 'code') ? <button type="button" className="ql-code-block" /> : null}
      </span>
      <span className="ql-formats">
        {has(enabled, 'list') ? <button type="button" className="ql-list" value="bullet" /> : null}
        {has(enabled, 'ordered') ? <button type="button" className="ql-list" value="ordered" /> : null}
        {has(enabled, 'link') ? <button type="button" className="ql-link" /> : null}
        {has(enabled, 'table') ? <button type="button" className="ql-table">Tbl</button> : null}
        {has(enabled, 'image') ? <button type="button" className="ql-image" /> : null}
      </span>
    </>
  );
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
  const enabled = features && features.length > 0 ? features : DEFAULT_RICH_TEXT_FEATURES;
  const headerTemplate = useMemo(() => buildHeader(enabled), [enabled]);
  const formats = useMemo(() => buildFormats(enabled), [enabled]);
  const quillRef = useRef<any>(null);
  const [linkDialogVisible, setLinkDialogVisible] = useState(false);
  const [linkRange, setLinkRange] = useState<{ index: number; length: number } | null>(null);

  const applyCmsLink = (nextLink: ContentLinkValue) => {
    const quill = quillRef.current;
    if (!quill) {
      return;
    }
    const href = nextLink.url ?? (typeof nextLink.contentItemId === 'number' ? `#${nextLink.contentItemId}` : '');
    if (!href) {
      return;
    }
    const range = linkRange ?? quill.getSelection(true);
    const index = typeof range?.index === 'number' ? range.index : quill.getLength();
    const length = typeof range?.length === 'number' ? range.length : 0;
    if (length > 0) {
      quill.formatText(index, length, 'link', href, 'user');
      return;
    }
    const label = nextLink.text?.trim() || href;
    quill.insertText(index, label, 'link', href, 'user');
    quill.setSelection(index + label.length, 0, 'user');
  };

  return (
    <>
      <Editor
        className="ch-richtext-editor"
        value={value}
        onTextChange={(event) => onChange(event.htmlValue ?? '')}
        headerTemplate={readOnly ? null : headerTemplate}
        formats={formats}
        onLoad={(quill) => {
          quillRef.current = quill;
          const toolbar = quill?.getModule?.('toolbar');
          if (!toolbar) {
            return;
          }
          if (enabled.includes('table')) {
            toolbar.addHandler('table', () => {
              const range = quill.getSelection(true);
              const insertAt = typeof range?.index === 'number' ? range.index : quill.getLength();
              quill.clipboard.dangerouslyPasteHTML(insertAt, TABLE_HTML, 'user');
            });
          }
          if (enabled.includes('link') && token && siteId) {
            toolbar.addHandler('link', () => {
              const range = quill.getSelection(true);
              if (range && typeof range.index === 'number' && typeof range.length === 'number') {
                setLinkRange({ index: range.index, length: range.length });
              } else {
                setLinkRange(null);
              }
              setLinkDialogVisible(true);
            });
          }
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
            applyCmsLink(nextLink);
            setLinkDialogVisible(false);
          }}
        />
      ) : null}
    </>
  );
}
