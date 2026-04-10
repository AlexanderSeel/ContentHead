import { DialogPanel } from '../ui/atoms';
import { helpContent } from './helpContent';

function renderMarkdown(input: string): string {
  return input
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>');
}

export function HelpDialog({ topicKey, visible, onHide }: { topicKey: string | null; visible: boolean; onHide: () => void }) {
  const topic = topicKey ? helpContent[topicKey] : null;

  return (
    <DialogPanel header={topic?.title ?? 'Help'} visible={visible} onHide={onHide} className="w-11 md:w-10 lg:w-8 xl:w-6">
      <div dangerouslySetInnerHTML={{ __html: renderMarkdown(topic?.markdown ?? 'No help topic found.') }} />
    </DialogPanel>
  );
}
