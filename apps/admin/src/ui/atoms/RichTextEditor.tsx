import { RichTextEditor as CoreRichTextEditor } from '../../features/content/fieldRenderers/RichTextEditor';

export function RichTextEditor({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  return <CoreRichTextEditor value={value} onChange={onChange} />;
}
