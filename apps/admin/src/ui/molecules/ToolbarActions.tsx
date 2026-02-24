import type { ReactNode } from 'react';

export function ToolbarActions({ left, right }: { left?: ReactNode; right?: ReactNode }) {
  return (
    <section className="content-pages-toolbar">
      <div className="inline-actions">{left}</div>
      <div className="inline-actions">{right}</div>
    </section>
  );
}
