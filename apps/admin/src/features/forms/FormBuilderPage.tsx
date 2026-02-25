import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { useAdminContext } from '../../app/AdminContext';
import { useUi } from '../../app/UiContext';
import { isForbiddenError } from '../../lib/graphqlErrorUi';
import { CommandMenuButton } from '../../ui/commands/CommandMenuButton';
import { commandRegistry } from '../../ui/commands/registry';
import type { Command, CommandContext } from '../../ui/commands/types';
import { routeStartsWith } from '../../ui/commands/utils';
import { ForbiddenState, WorkspaceActionBar, WorkspaceBody, WorkspaceHeader, WorkspacePage } from '../../ui/molecules';
import { FormBuilderSection } from '../FormBuilderSection';

type FormBuilderHeaderContext = CommandContext & {
  openSubmissions: () => void;
};

const formBuilderHeaderCommands: Command<FormBuilderHeaderContext>[] = [
  {
    id: 'form-builder.open-submissions',
    label: 'Open submissions',
    icon: 'pi pi-inbox',
    group: 'Advanced',
    visible: (ctx) => routeStartsWith(ctx.route, '/forms/builder'),
    run: (ctx) => ctx.openSubmissions()
  }
];

commandRegistry.registerCoreCommands([{ placement: 'overflow', commands: formBuilderHeaderCommands }]);

export function FormBuilderPage() {
  const { siteId } = useAdminContext();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useUi();
  const { formId } = useParams<{ formId?: string }>();
  const [status, setStatus] = useState('');
  const initialFormId = formId ? Number(formId) : null;
  const forbiddenReason = status && isForbiddenError(status) ? status : '';

  const headerContext: FormBuilderHeaderContext = {
    route: location.pathname,
    siteId,
    selectedContentItemId: null,
    toast,
    openSubmissions: () => navigate('/forms/submissions')
  };
  const headerOverflowCommands = commandRegistry.getCommands(headerContext, 'overflow');

  return (
    <WorkspacePage>
      <WorkspaceHeader
        title="Form Builder"
        subtitle="Steps, fields and conditional rules."
        helpTopicKey="forms"
      />
      {forbiddenReason ? (
        <WorkspaceBody>
          <ForbiddenState title="Form builder unavailable" reason={forbiddenReason} />
        </WorkspaceBody>
      ) : (
        <>
          <WorkspaceActionBar
            overflow={<CommandMenuButton commands={headerOverflowCommands} context={headerContext} buttonLabel="" buttonIcon="pi pi-ellipsis-h" text />}
          />
          <WorkspaceBody>
            <FormBuilderSection siteId={siteId} initialFormId={Number.isFinite(initialFormId) ? initialFormId : null} onStatus={setStatus} />
          </WorkspaceBody>
          {status ? <div className="status-panel" role="alert">{status}</div> : null}
        </>
      )}
    </WorkspacePage>
  );
}
