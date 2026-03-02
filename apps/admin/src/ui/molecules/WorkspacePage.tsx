import type { ReactNode } from 'react';
import { Children, Fragment, createContext, isValidElement, useContext, useEffect, useMemo, useRef, useState } from 'react';
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

type WorkspaceHeaderProps = {
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
};

type WorkspaceActionBarProps = {
  primary?: ReactNode;
  modeToggle?: ReactNode;
  overflow?: ReactNode;
};

type WorkspaceToolbarProps = {
  children?: ReactNode;
  defaultExpanded?: boolean;
  label?: string;
};

type WorkspaceFrameContextValue = {
  setPanelMenuModel: (items: MenuItem[]) => void;
};

const WorkspaceFrameContext = createContext<WorkspaceFrameContextValue | null>(null);

function mergeNodePair(a: ReactNode, b: ReactNode): ReactNode {
  return (
    <>
      {a}
      {b}
    </>
  );
}

function mergeActionBarProps(current: WorkspaceActionBarProps | undefined, next: WorkspaceActionBarProps): WorkspaceActionBarProps {
  if (!current) {
    return next;
  }
  return {
    primary: current.primary && next.primary ? mergeNodePair(current.primary, next.primary) : (current.primary ?? next.primary),
    modeToggle: current.modeToggle && next.modeToggle ? mergeNodePair(current.modeToggle, next.modeToggle) : (current.modeToggle ?? next.modeToggle),
    overflow: current.overflow && next.overflow ? mergeNodePair(current.overflow, next.overflow) : (current.overflow ?? next.overflow)
  };
}

function WorkspaceTopbar({
  header,
  actions,
  toolbarVisible,
  hasToolbar,
  onToggleToolbar,
  panelMenuModel,
  onOpenHelp,
  onOpenAskAi
}: {
  header?: WorkspaceHeaderProps;
  actions?: WorkspaceActionBarProps;
  toolbarVisible: boolean;
  hasToolbar: boolean;
  onToggleToolbar: () => void;
  panelMenuModel: MenuItem[];
  onOpenHelp: () => void;
  onOpenAskAi: () => void;
}) {
  const topic = header?.helpTopicKey ? helpContent[header.helpTopicKey] : undefined;
  const breadcrumbModel = useMemo<MenuItem[]>(
    () =>
      (header?.breadcrumbs ?? []).map((entry) => ({
        label: entry.label,
        ...(entry.url ? { url: entry.url } : {}),
        ...(entry.command ? { command: entry.command } : {})
      })),
    [header?.breadcrumbs]
  );

  const panelOverflowModel = useMemo<MenuItem[]>(() => {
    if (panelMenuModel.length === 0) {
      return [];
    }
    return [{ label: 'Panels', icon: 'pi pi-window-maximize', items: panelMenuModel }];
  }, [panelMenuModel]);

  return (
    <section className="workspaceTopbar">
      <div className="workspaceTopbarLeft">
        <h1>{header?.title ?? ''}</h1>
        {header?.subtitle ? <p title={header.subtitle}>{header.subtitle}</p> : null}
      </div>
      <div className="workspaceTopbarMiddle">
        {breadcrumbModel.length > 0 ? <BreadCrumb model={breadcrumbModel} home={{ icon: 'pi pi-home' }} /> : null}
      </div>
      <div className="workspaceTopbarRight">
        {header?.badges}
        {topic ? <HelpIcon tooltip={topic.tooltip ?? ''} onClick={onOpenHelp} /> : null}
        {header?.askAiContext ? <Button text icon="pi pi-sparkles" label="Ask AI" onClick={onOpenAskAi} /> : null}
        {header?.actions}
        {actions?.primary}
        {actions?.modeToggle}
        {hasToolbar ? (
          <Button
            text
            size="small"
            icon="pi pi-filter"
            label={toolbarVisible ? 'Filters On' : 'Filters'}
            onClick={onToggleToolbar}
          />
        ) : null}
        {actions?.overflow}
        {panelOverflowModel.length > 0 ? (
          <WorkspaceOverflowMenu
            model={panelOverflowModel}
            label=""
            icon="pi pi-window-maximize"
            size="small"
            className="ch-command-menu-trigger"
          />
        ) : null}
      </div>
    </section>
  );
}

export function WorkspacePage({ children, className }: { children: ReactNode; className?: string }) {
  const { layoutPreferences } = useUi();
  let headerProps: WorkspaceHeaderProps | undefined;
  let actionBarProps: WorkspaceActionBarProps | undefined;
  let toolbarProps: WorkspaceToolbarProps | undefined;
  const bodyChildren: ReactNode[] = [];
  const trailingChildren: ReactNode[] = [];

  const collect = (node: ReactNode): void => {
    if (!isValidElement(node)) {
      trailingChildren.push(node);
      return;
    }

    if (node.type === Fragment) {
      const fragmentChildren = (node.props as { children?: ReactNode }).children ?? null;
      Children.forEach(fragmentChildren, collect);
      return;
    }

    const child = node;
    if (!isValidElement(child)) {
      trailingChildren.push(child);
      return;
    }
    if (child.type === WorkspaceHeader) {
      headerProps = child.props as WorkspaceHeaderProps;
      return;
    }
    if (child.type === WorkspaceActionBar) {
      actionBarProps = mergeActionBarProps(actionBarProps, child.props as WorkspaceActionBarProps);
      return;
    }
    if (child.type === WorkspaceToolbar) {
      toolbarProps = child.props as WorkspaceToolbarProps;
      return;
    }
    if (child.type === WorkspaceBody) {
      bodyChildren.push((child.props as { children?: ReactNode }).children ?? null);
      return;
    }
    trailingChildren.push(child);
  };

  Children.forEach(children, collect);

  const [helpOpen, setHelpOpen] = useState(false);
  const [askAiOpen, setAskAiOpen] = useState(false);
  const [toolbarExpanded, setToolbarExpanded] = useState<boolean>(toolbarProps?.defaultExpanded ?? false);
  const [panelMenuModel, setPanelMenuModel] = useState<MenuItem[]>([]);
  const previousToolbarDefault = useRef<boolean>(toolbarProps?.defaultExpanded ?? false);

  const hasToolbar = Boolean(toolbarProps?.children);
  const topic = headerProps?.helpTopicKey ? helpContent[headerProps.helpTopicKey] : undefined;
  const classNames = ['pageRoot', 'workspaceRoot', `workspace-density-${layoutPreferences.density}`, className]
    .filter(Boolean)
    .join(' ');

  useEffect(() => {
    const nextDefault = toolbarProps?.defaultExpanded ?? false;
    if (nextDefault !== previousToolbarDefault.current) {
      previousToolbarDefault.current = nextDefault;
      setToolbarExpanded(nextDefault);
    }
  }, [toolbarProps?.defaultExpanded]);

  const frameContextValue = useMemo<WorkspaceFrameContextValue>(
    () => ({
      setPanelMenuModel
    }),
    []
  );

  return (
    <WorkspaceFrameContext.Provider value={frameContextValue}>
      <div className={classNames}>
        <WorkspaceTopbar
          {...(headerProps ? { header: headerProps } : {})}
          {...(actionBarProps ? { actions: actionBarProps } : {})}
          hasToolbar={hasToolbar}
          toolbarVisible={toolbarExpanded}
          onToggleToolbar={() => setToolbarExpanded((current) => !current)}
          panelMenuModel={panelMenuModel}
          onOpenHelp={() => setHelpOpen(true)}
          onOpenAskAi={() => setAskAiOpen(true)}
        />
        {hasToolbar && toolbarExpanded ? <section className="workspaceToolbar">{toolbarProps?.children}</section> : null}
        <section className="workspaceBody">
          {bodyChildren.length > 0 ? bodyChildren : null}
        </section>
        {trailingChildren}
      </div>
      {topic ? <HelpDialog topicKey={headerProps?.helpTopicKey ?? null} visible={helpOpen} onHide={() => setHelpOpen(false)} /> : null}
      {headerProps?.askAiContext ? (
        <AskAiDialog
          visible={askAiOpen}
          onHide={() => setAskAiOpen(false)}
          defaultContext={headerProps.askAiContext}
          contextPayload={headerProps.askAiPayload ?? {}}
          {...(headerProps.onAskAiApply ? { onApply: headerProps.onAskAiApply } : {})}
          {...(headerProps.onAskAiInsert ? { onInsert: headerProps.onAskAiInsert } : {})}
        />
      ) : null}
    </WorkspaceFrameContext.Provider>
  );
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
}: WorkspaceHeaderProps) {
  void title;
  void subtitle;
  void breadcrumbs;
  void badges;
  void actions;
  void helpTopicKey;
  void askAiContext;
  void askAiPayload;
  void onAskAiApply;
  void onAskAiInsert;
  return null;
}

export function WorkspaceOverflowMenu({
  model,
  label = 'More',
  icon = 'pi pi-ellipsis-h',
  size = 'small',
  className
}: {
  model: MenuItem[];
  label?: string;
  icon?: string;
  size?: 'small' | 'large';
  className?: string;
}) {
  const menuRef = useRef<Menu | null>(null);
  if (model.length === 0) {
    return null;
  }
  return (
    <>
      <Menu popup model={model} ref={(ref) => (menuRef.current = ref)} />
      <Button
        icon={icon}
        label={label}
        text
        size={size}
        className={className}
        aria-label={label || 'More actions'}
        onClick={(event) => menuRef.current?.toggle(event)}
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
  void primary;
  void modeToggle;
  void overflow;
  return null;
}

export function WorkspaceToolbar({
  children,
  defaultExpanded = false,
  label = 'Toolbar'
}: WorkspaceToolbarProps) {
  void children;
  void defaultExpanded;
  void label;
  return null;
}

export function WorkspaceBody({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useWorkspaceFrame() {
  return useContext(WorkspaceFrameContext);
}
