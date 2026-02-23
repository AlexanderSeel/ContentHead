import { Toolbar } from 'primereact/toolbar';
import type { ReactNode } from 'react';

export function PageHeader({
  title,
  subtitle,
  actions
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <Toolbar
      className="page-header"
      start={
        <div>
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
      }
      end={<div className="page-header-actions">{actions}</div>}
    />
  );
}
