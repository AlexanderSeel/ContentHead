import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Button } from 'primereact/button';
import { Menu } from 'primereact/menu';
import type { MenuItem } from 'primereact/menuitem';

import { useUi } from '../../app/UiContext';
import { AskAiDialog, type AskAiContextType } from '../../components/assist/AskAiDialog';
import { HelpDialog } from '../../help/HelpDialog';
import { helpContent } from '../../help/helpContent';
import { HelpIcon } from '../../help/HelpIcon';

type BreadcrumbItem = {
  label: string;
  url?: string;
  command?: () => void;
};

export function WorkspacePage({ children, className }: { children: ReactNode; className?: string }) {
  const { layoutPreferences } = useUi();
  const classNames = ['pageRoot', 'workspace-page', `workspace-density-${layoutPreferences.density}`, className]
    .filter(Boolean)
    .join(' ');
  return <div className={classNames}>{children}</div>;
}

export function WorkspaceHeader({
  title,
  subtitle,
  breadcrumbs,
  badges,
  actions,
  helpTopicKey,
  askAiContext,
  askAiPayload,
  onAskAiApply,
  onAskAiInsert
}: {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  badges?: ReactNode;
  actions?: ReactNode;
  helpTopicKey?: string;
  askAiContext?: AskAiContextType;
  askAiPayload?: Record<string, unknown>;
  onAskAiApply?: (value: string) => void;
  onAskAiInsert?: (value: string) => void;
}) {
  const [helpOpen, setHelpOpen] = useState(false);
  const [askAiOpen, setAskAiOpen] = useState(false);
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
          {askAiContext ? <Button text icon="pi pi-sparkles" label="Ask AI" onClick={() => setAskAiOpen(true)} /> : null}
          {actions}
        </div>
      </section>
      {topic ? <HelpDialog topicKey={helpTopicKey ?? null} visible={helpOpen} onHide={() => setHelpOpen(false)} /> : null}
      {askAiContext ? (
        <AskAiDialog
          visible={askAiOpen}
          onHide={() => setAskAiOpen(false)}
          defaultContext={askAiContext}
          contextPayload={askAiPayload ?? {}}
          {...(onAskAiApply ? { onApply: onAskAiApply } : {})}
          {...(onAskAiInsert ? { onInsert: onAskAiInsert } : {})}
        />
      ) : null}
    </>
  );
}

export function WorkspaceOverflowMenu({
  model,
  label = 'More'
}: {
  model: MenuItem[];
  label?: string;
}) {
  const [menu] = useState(() => ({ current: null as Menu | null }));
  if (model.length === 0) {
    return null;
  }
  return (
    <>
      <Menu popup model={model} ref={(ref) => (menu.current = ref)} />
      <Button
        icon="pi pi-ellipsis-h"
        label={label}
        text
        aria-label={label}
        onClick={(event) => menu.current?.toggle(event)}
      />
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
  defaultExpanded = true,
  label = 'Toolbar'
}: {
  children?: ReactNode;
  defaultExpanded?: boolean;
  label?: string;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  if (!children) {
    return null;
  }
  return (
    <section className="workspace-toolbar">
      <div className="inline-actions" style={{ justifyContent: 'space-between' }}>
        <strong>{label}</strong>
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
