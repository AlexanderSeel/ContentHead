import { InputTextarea } from 'primereact/inputtextarea';

export function Textarea({
  value,
  onChange,
  placeholder,
  rows,
  readOnly,
  autoResize
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  rows?: number;
  readOnly?: boolean;
  autoResize?: boolean;
  disabled?: boolean;
}) {
  return (
    <InputTextarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      readOnly={readOnly}
      autoResize={autoResize}
      disabled={disabled}
    />
  );
}
