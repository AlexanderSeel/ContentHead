import type { ReactNode } from 'react';

export function PaneRoot({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={['paneRoot', className].filter(Boolean).join(' ')}>{children}</div>;
}

export function PaneScroll({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={['paneScroll', className].filter(Boolean).join(' ')}>{children}</div>;
}
