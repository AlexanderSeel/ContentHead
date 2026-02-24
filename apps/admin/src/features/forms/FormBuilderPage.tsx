import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { useAdminContext } from '../../app/AdminContext';
import { useUi } from '../../app/UiContext';
import { PageHeader } from '../../components/common/PageHeader';
import { CommandMenuButton } from '../../ui/commands/CommandMenuButton';
import { commandRegistry } from '../../ui/commands/registry';
import type { Command, CommandContext } from '../../ui/commands/types';
import { routeStartsWith } from '../../ui/commands/utils';
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

commandRegistry.registerCoreCommands([{ placement: 'pageHeaderOverflow', commands: formBuilderHeaderCommands }]);

export function FormBuilderPage() {
  const { siteId } = useAdminContext();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useUi();
  const { formId } = useParams<{ formId?: string }>();
  const [status, setStatus] = useState('');
  const initialFormId = formId ? Number(formId) : null;

  const headerContext: FormBuilderHeaderContext = {
    route: location.pathname,
    siteId,
    selectedContentItemId: null,
    toast,
    openSubmissions: () => navigate('/forms/submissions')
  };
  const headerOverflowCommands = commandRegistry.getCommands(headerContext, 'pageHeaderOverflow');

  return (
    <div className="pageRoot">
      <PageHeader
        title="Form Builder"
        subtitle="Steps, fields and conditional rules"
        helpTopicKey="forms"
        askAiContext="forms"
        askAiPayload={{ siteId }}
        actions={<CommandMenuButton commands={headerOverflowCommands} context={headerContext} buttonLabel="" buttonIcon="pi pi-ellipsis-h" text />}
      />
      <FormBuilderSection siteId={siteId} initialFormId={Number.isFinite(initialFormId) ? initialFormId : null} onStatus={setStatus} />
      {status ? <pre>{status}</pre> : null}
    </div>
  );
}
