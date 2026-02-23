import { useState } from 'react';
import type { ReactNode } from 'react';
import { Button } from 'primereact/button';

import { AskAiDialog, type AskAiContextType } from '../assist/AskAiDialog';
import { HelpDialog } from '../../help/HelpDialog';
import { helpContent } from '../../help/helpContent';
import { HelpIcon } from '../../help/HelpIcon';

export function PageHeader({
  title,
  subtitle,
  actions,
  helpTopicKey,
  askAiContext,
  askAiPayload,
  onAskAiApply,
  onAskAiInsert
}: {
  title: string;
  subtitle?: string;
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
  const hasHelp = Boolean(topic);

  return (
    <>
      <section className="page-header">
        <div className="page-header-copy">
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        <div className="page-header-actions">
          {hasHelp ? <HelpIcon tooltip={topic?.tooltip ?? ''} onClick={() => setHelpOpen(true)} /> : null}
          {askAiContext ? <Button text icon="pi pi-sparkles" label="Ask AI" onClick={() => setAskAiOpen(true)} /> : null}
          {actions}
        </div>
      </section>
      {hasHelp ? <HelpDialog topicKey={helpTopicKey ?? null} visible={helpOpen} onHide={() => setHelpOpen(false)} /> : null}
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
