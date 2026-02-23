import { Dialog } from 'primereact/dialog';

import { helpContent } from './helpContent';

function renderMarkdown(input: string): string {
  return input
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>');
}

export function HelpDialog({ topicKey, visible, onHide }: { topicKey: string | null; visible: boolean; onHide: () => void }) {
  const topic = topicKey ? helpContent[topicKey] : null;

  return (
    <Dialog header={topic?.title ?? 'Help'} visible={visible} onHide={onHide} style={{ width: '34rem' }}>
      <div dangerouslySetInnerHTML={{ __html: renderMarkdown(topic?.markdown ?? 'No help topic found.') }} />
    </Dialog>
  );
}
