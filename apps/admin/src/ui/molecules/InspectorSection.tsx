import type { ReactNode } from 'react';
import { useState } from 'react';
import { Button } from '../atoms';

export function InspectorSection({
  title,
  children,
  defaultCollapsed = false,
  actions
}: {
  title: string;
  children: ReactNode;
  defaultCollapsed?: boolean;
  actions?: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <section className="content-card inspector-section">
      <div className="inline-actions justify-content-between">
        <div className="inline-actions">
          <Button text icon={collapsed ? 'pi pi-angle-right' : 'pi pi-angle-down'} onClick={() => setCollapsed((prev) => !prev)} />
          <strong>{title}</strong>
        </div>
        {actions}
      </div>
      {!collapsed ? <div className="mt-2">{children}</div> : null}
    </section>
  );
}

