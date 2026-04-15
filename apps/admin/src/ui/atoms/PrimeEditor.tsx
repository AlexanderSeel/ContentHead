/**
 * Quill-based rich text editor — replaces the primereact/editor wrapper.
 * Maintains the same prop interface so RichTextEditor.tsx needs no changes.
 */
import { useEffect, useRef, type ReactNode } from 'react';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Quill = any;

export type EditorTextChangeEvent = { htmlValue: string | null; textValue: string; delta: unknown; source: string };
export type EditorSelectionChangeEvent = { range: unknown; oldRange: unknown; source: string };

export type EditorProps = {
  value?: string;
  onTextChange?: (event: EditorTextChangeEvent) => void;
  onSelectionChange?: (event: EditorSelectionChangeEvent) => void;
  onLoad?: (quill: Quill) => void;
  headerTemplate?: ReactNode;
  formats?: string[];
  readOnly?: boolean | undefined;
  className?: string;
  style?: React.CSSProperties;
};

export function Editor({
  value,
  onTextChange,
  onLoad,
  headerTemplate,
  formats,
  readOnly,
  className,
  style
}: EditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const onTextChangeRef = useRef(onTextChange);
  onTextChangeRef.current = onTextChange;

  useEffect(() => {
    if (!containerRef.current || quillRef.current) return;

    import('quill').then((mod) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const QuillClass = (mod.default ?? mod) as any;
      const editorEl = containerRef.current;
      if (!editorEl) return;

      const quill = new QuillClass(editorEl, {
        theme: 'snow',
        readOnly: readOnly ?? false,
        formats: formats ?? undefined,
        modules: {
          toolbar: false,
          history: { delay: 400, maxStack: 100, userOnly: true }
        }
      });

      quillRef.current = quill;

      if (value) {
        quill.clipboard.dangerouslyPasteHTML(value);
      }

      quill.on('text-change', (delta: unknown, _old: unknown, source: unknown) => {
        const html = editorEl.querySelector('.ql-editor')?.innerHTML ?? '';
        const text = quill.getText();
        onTextChangeRef.current?.({
          htmlValue: html === '<p><br></p>' ? '' : html,
          textValue: text,
          delta,
          source: String(source)
        });
      });

      onLoad?.(quill);
    });

    return () => {
      // Quill 1.x has no destroy(); just clear the ref
      quillRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync readOnly changes
  useEffect(() => {
    quillRef.current?.enable(!(readOnly ?? false));
  }, [readOnly]);

  // Sync value from outside (only when it differs from editor content)
  useEffect(() => {
    const quill = quillRef.current;
    if (!quill || !containerRef.current) return;
    const current = containerRef.current.querySelector('.ql-editor')?.innerHTML ?? '';
    if ((value ?? '') !== current) {
      quill.clipboard.dangerouslyPasteHTML(value ?? '');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const classes = ['p-editor-container', className].filter(Boolean).join(' ');

  return (
    <div className={classes} style={style}>
      {headerTemplate ? (
        <div className="p-editor-toolbar ql-toolbar ql-snow">{headerTemplate}</div>
      ) : null}
      <div ref={containerRef} className="p-editor-content" />
    </div>
  );
}
