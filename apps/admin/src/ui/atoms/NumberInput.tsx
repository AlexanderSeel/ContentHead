export function NumberInput({
  value,
  onChange,
  min,
  max,
  showButtons,
  disabled
}: {
  value: number | null;
  onChange: (next: number | null) => void;
  min?: number;
  max?: number;
  showButtons?: boolean;
  disabled?: boolean;
}) {
  return (
    <input
      type="number"
      className="p-inputtext p-component"
      value={value ?? ''}
      onChange={(e) => {
        const v = e.target.value;
        onChange(v === '' ? null : Number(v));
      }}
      min={min}
      max={max}
      disabled={disabled}
    />
  );
}
