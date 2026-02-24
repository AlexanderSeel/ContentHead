import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Button } from 'primereact/button';
import type { MenuItem } from 'primereact/menuitem';

import { HelpDialog } from '../../help/HelpDialog';
import { helpContent } from '../../help/helpContent';
import { HelpIcon } from '../../help/HelpIcon';

type BreadcrumbItem = {
  label: string;
  url?: string;
  command?: () => void;
};

export function WorkspacePage({ children }: { children: ReactNode }) {
  return <div className="pageRoot workspace-page">{children}</div>;
}

export function WorkspaceHeader({
  title,
  subtitle,
  breadcrumbs,
  badges,
  helpTopicKey
}: {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  badges?: ReactNode;
  helpTopicKey?: string;
}) {
  const [helpOpen, setHelpOpen] = useState(false);
  const topic = helpTopicKey ? helpContent[helpTopicKey] : undefined;
  const model = useMemo<MenuItem[]>(
    () =>
      (breadcrumbs ?? []).map((entry) => ({
        label: entry.label,
        ...(entry.url ? { url: entry.url } : {}),
        ...(entry.command ? { command: entry.command } : {})
      })),
    [breadcrumbs]
  );

  return (
    <>
      <section className="workspace-header">
        <div className="workspace-header-copy">
          {model.length > 0 ? <BreadCrumb model={model} home={{ icon: 'pi pi-home' }} /> : null}
          <h1>{title}</h1>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        <div className="workspace-header-meta">
          {badges}
          {topic ? <HelpIcon tooltip={topic.tooltip ?? ''} onClick={() => setHelpOpen(true)} /> : null}
        </div>
      </section>
      {topic ? <HelpDialog topicKey={helpTopicKey ?? null} visible={helpOpen} onHide={() => setHelpOpen(false)} /> : null}
    </>
  );
}

export function WorkspaceActionBar({
  primary,
  modeToggle,
  overflow
}: {
  primary?: ReactNode;
  modeToggle?: ReactNode;
  overflow?: ReactNode;
}) {
  return (
    <section className="workspace-actionbar">
      <div className="inline-actions">{primary}</div>
      <div className="inline-actions">
        {modeToggle}
        {overflow}
      </div>
    </section>
  );
}

export function WorkspaceToolbar({
  children,
  defaultExpanded = true
}: {
  children?: ReactNode;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  if (!children) {
    return null;
  }
  return (
    <section className="workspace-toolbar">
      <div className="inline-actions" style={{ justifyContent: 'space-between' }}>
        <strong>Tools</strong>
        <Button
          text
          size="small"
          icon={expanded ? 'pi pi-angle-up' : 'pi pi-angle-down'}
          label={expanded ? 'Collapse' : 'Expand'}
          onClick={() => setExpanded((prev) => !prev)}
        />
      </div>
      {expanded ? <div className="workspace-toolbar-content">{children}</div> : null}
    </section>
  );
}

export function WorkspaceBody({ children }: { children: ReactNode }) {
  return <section className="pageBodyFlex splitFill workspace-body">{children}</section>;
}
