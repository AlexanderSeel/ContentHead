import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Column } from 'primereact/column';
import { ContextMenu } from 'primereact/contextmenu';
import { Accordion, AccordionItem, Button } from '../../ui/atoms';

import { createAdminSdk } from '../../lib/sdk';
import { useAuth } from '../../app/AuthContext';
import { useUi } from '../../app/UiContext';
import { CommandMenuButton } from '../../ui/commands/CommandMenuButton';
import { commandRegistry } from '../../ui/commands/registry';
import { toTieredMenuItems } from '../../ui/commands/menuModel';
import type { Command, CommandContext } from '../../ui/commands/types';
import { downloadJson, routeStartsWith } from '../../ui/commands/utils';
import { WorkspaceActionBar, WorkspaceBody, WorkspaceGrid, WorkspaceHeader, WorkspacePage, WorkspacePaneLayout } from '../../ui/molecules';

type WorkflowRun = { id: number; definitionId: number; status: string; currentNodeId?: string | null; logsJson: string; contextJson: string };

type WorkflowRunsHeaderContext = CommandContext & {
  runs: WorkflowRun[];
  refresh: () => Promise<void>;
};

type WorkflowRunsRowContext = CommandContext & {
  row: WorkflowRun;
  selectRun: (row: WorkflowRun) => void;
  approve: (row: WorkflowRun) => Promise<void>;
  retry: (row: WorkflowRun) => Promise<void>;
};

const workflowRunsHeaderCommands: Command<WorkflowRunsHeaderContext>[] = [
  {
    id: 'workflow-runs.export.json',
    label: 'Export runs JSON',
    icon: 'pi pi-download',
    group: 'Export',
    visible: (ctx) => routeStartsWith(ctx.route, '/workflows/runs'),
    enabled: (ctx) => ctx.runs.length > 0,
    run: (ctx) => {
      downloadJson('workflow-runs.json', ctx.runs);
      ctx.toast?.({ severity: 'success', summary: 'Workflow runs exported' });
    }
  },
  {
    id: 'workflow-runs.advanced.refresh',
    label: 'Refresh',
    icon: 'pi pi-refresh',
    group: 'Advanced',
    visible: (ctx) => routeStartsWith(ctx.route, '/workflows/runs'),
    run: (ctx) => ctx.refresh()
  }
];

const workflowRunsRowCommands: Command<WorkflowRunsRowContext>[] = [
  {
    id: 'workflow-runs.row.open',
    label: 'Open',
    icon: 'pi pi-folder-open',
    visible: (ctx) => routeStartsWith(ctx.route, '/workflows/runs'),
    run: (ctx) => ctx.selectRun(ctx.row)
  },
  {
    id: 'workflow-runs.row.approve',
    label: 'Approve Step',
    icon: 'pi pi-check',
    visible: (ctx) => routeStartsWith(ctx.route, '/workflows/runs'),
    enabled: (ctx) => ctx.row.status === 'PAUSED' && Boolean(ctx.row.currentNodeId),
    run: (ctx) => ctx.approve(ctx.row)
  },
  {
    id: 'workflow-runs.row.retry',
    label: 'Retry',
    icon: 'pi pi-replay',
    visible: (ctx) => routeStartsWith(ctx.route, '/workflows/runs'),
    enabled: (ctx) => ctx.row.status === 'FAILED',
    run: (ctx) => ctx.retry(ctx.row)
  }
];

commandRegistry.registerCoreCommands([{ placement: 'overflow', commands: workflowRunsHeaderCommands }]);
commandRegistry.registerCoreCommands([{ placement: 'rowOverflow', commands: workflowRunsRowCommands }]);

export function WorkflowRunsPage() {
  const location = useLocation();
  const { token } = useAuth();
  const { toast } = useUi();
  const sdk = useMemo(() => createAdminSdk(token), [token]);
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [selected, setSelected] = useState<WorkflowRun | null>(null);
  const [contextRun, setContextRun] = useState<WorkflowRun | null>(null);
  const contextMenuRef = useRef<ContextMenu>(null);

  const refresh = async () => {
    const list = await sdk.listWorkflowRuns({ definitionId: null });
    setRuns((list.listWorkflowRuns ?? []) as WorkflowRun[]);
  };

  useEffect(() => {
    refresh().catch(() => undefined);
  }, []);

  const baseContext: CommandContext = {
    route: location.pathname,
    selectedContentItemId: null,
    selectionIds: selected ? [selected.id] : [],
    toast
  };
  const headerContext: WorkflowRunsHeaderContext = { ...baseContext, runs, refresh };
  const headerOverflowCommands = commandRegistry.getCommands(headerContext, 'overflow');

  const rowContextFor = (row: WorkflowRun): WorkflowRunsRowContext => ({
    ...baseContext,
    row,
    selectRun: setSelected,
    approve: async (entry) => {
      await sdk.approveStep({ runId: entry.id, nodeId: entry.currentNodeId ?? '', approvedBy: 'admin' });
      await refresh();
      toast({ severity: 'success', summary: `Run #${entry.id} approved` });
    },
    retry: async (entry) => {
      await sdk.retryFailed({ runId: entry.id });
      await refresh();
      toast({ severity: 'success', summary: `Run #${entry.id} retried` });
    }
  });
  const contextItems = contextRun ? toTieredMenuItems(commandRegistry.getCommands(rowContextFor(contextRun), 'rowOverflow'), rowContextFor(contextRun)) : [];

  return (
    <WorkspacePage>
      <WorkspaceHeader
        title="Workflow Runs"
        subtitle="Run status, approvals, context, and logs."
        helpTopicKey="workflows"
      />
      <WorkspaceActionBar
        primary={<Button label="Refresh" onClick={() => refresh().catch(() => undefined)} />}
        overflow={<CommandMenuButton commands={headerOverflowCommands} context={headerContext} buttonLabel="" buttonIcon="pi pi-ellipsis-h" text />}
      />
      <WorkspaceBody>
        <WorkspacePaneLayout
          workspaceId="workflows-runs"
          left={{
            id: 'runs',
            label: 'Runs',
            defaultSize: 48,
            minSize: 28,
            collapsible: true,
            content: (
              <>
                <ContextMenu ref={contextMenuRef} model={contextItems} />
                <WorkspaceGrid
                  value={runs}
                  tableProps={{
                    selectionMode: 'single',
                    selection: selected,
                    onSelectionChange: (event: any) => setSelected(event.value as WorkflowRun),
                    onContextMenu: (event: any) => {
                      setContextRun(event.data as WorkflowRun);
                      window.requestAnimationFrame(() => contextMenuRef.current?.show(event.originalEvent));
                    }
                  }}
                  rowOverflow={{
                    commandsForRow: (row) => commandRegistry.getCommands(rowContextFor(row), 'rowOverflow'),
                    contextForRow: rowContextFor
                  }}
                >
                  <Column field="id" header="Run ID" />
                  <Column field="definitionId" header="Definition" />
                  <Column field="status" header="Status" />
                  <Column field="currentNodeId" header="Current Node" />
                </WorkspaceGrid>
              </>
            )
          }}
          center={{
            id: 'details',
            label: 'Details',
            defaultSize: 52,
            minSize: 30,
            collapsible: false,
            content: !selected ? (
              <div className="status-panel">Select a run to inspect context and logs.</div>
            ) : (
              <Accordion multiple activeIndex={[0]}>
                <AccordionItem header={`Basic: Run #${selected.id} Context`}>
                  <pre>{JSON.stringify(JSON.parse(selected.contextJson || '{}'), null, 2)}</pre>
                </AccordionItem>
                <AccordionItem header="Advanced: Timeline / Logs">
                  <pre>{JSON.stringify(JSON.parse(selected.logsJson || '[]'), null, 2)}</pre>
                </AccordionItem>
              </Accordion>
            )
          }}
        />
      </WorkspaceBody>
    </WorkspacePage>
  );
}
