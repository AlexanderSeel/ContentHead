import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function SlugEditor({
  value,
  sourceText,
  onChange
}: {
  value: string;
  sourceText?: string;
  onChange: (value: string) => void;
}) {
  const isValid = /^[a-z0-9][a-z0-9-/]*$/.test(value);

  return (
    <div className="form-row">
      <label>Slug</label>
      <div className="inline-actions">
        <InputText value={value} onChange={(event) => onChange(event.target.value)} placeholder="start" />
        <Button
          size="small"
          type="button"
          label="Generate"
          onClick={() => onChange(slugify(sourceText ?? value))}
        />
      </div>
      {!isValid ? <small className="editor-error">Use lowercase letters, numbers, hyphen and slash.</small> : null}
    </div>
  );
}
