import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAdminContext } from '../../app/AdminContext';
import { useUi } from '../../app/UiContext';
import { PageHeader } from '../../components/common/PageHeader';
import { CommandMenuButton } from '../../ui/commands/CommandMenuButton';
import { commandRegistry } from '../../ui/commands/registry';
import type { Command, CommandContext } from '../../ui/commands/types';
import { routeStartsWith } from '../../ui/commands/utils';
import { WorkflowDesignerSection } from '../WorkflowDesignerSection';

type WorkflowDesignerHeaderContext = CommandContext & {
  openRuns: () => void;
};

const workflowDesignerHeaderCommands: Command<WorkflowDesignerHeaderContext>[] = [
  {
    id: 'workflow-designer.open-runs',
    label: 'Open workflow runs',
    icon: 'pi pi-list',
    group: 'Advanced',
    visible: (ctx) => routeStartsWith(ctx.route, '/workflows/designer'),
    run: (ctx) => ctx.openRuns()
  }
];

commandRegistry.registerCoreCommands([{ placement: 'pageHeaderOverflow', commands: workflowDesignerHeaderCommands }]);

export function WorkflowDesignerPage() {
  const { siteId, marketCode, localeCode } = useAdminContext();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useUi();
  const [status, setStatus] = useState('');

  const headerContext: WorkflowDesignerHeaderContext = {
    route: location.pathname,
    siteId,
    marketCode,
    localeCode,
    selectedContentItemId: null,
    toast,
    openRuns: () => navigate('/workflows/runs')
  };
  const headerOverflowCommands = commandRegistry.getCommands(headerContext, 'pageHeaderOverflow');

  return (
    <div className="pageRoot">
      <PageHeader
        title="Workflow Designer"
        subtitle="Design and configure workflow graphs"
        helpTopicKey="workflows"
        askAiContext="workflows"
        askAiPayload={{ siteId, marketCode, localeCode }}
        actions={<CommandMenuButton commands={headerOverflowCommands} context={headerContext} buttonLabel="" buttonIcon="pi pi-ellipsis-h" text />}
      />
      <WorkflowDesignerSection
        siteId={siteId}
        selectedItemId={null}
        selectedVariantSetId={null}
        market={marketCode}
        locale={localeCode}
        onStatus={setStatus}
      />
      {status ? <pre>{status}</pre> : null}
    </div>
  );
}
