import { InputNumber } from 'primereact/inputnumber';

export function NumberInput({
  value,
  onChange,
  min,
  max,
  disabled
}: {
  value: number | null;
  onChange: (next: number | null) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}) {
  return <InputNumber value={value} onValueChange={(event) => onChange(event.value ?? null)} min={min} max={max} disabled={disabled} />;
}
