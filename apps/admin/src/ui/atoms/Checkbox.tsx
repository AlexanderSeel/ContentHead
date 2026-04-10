import { Checkbox as PrimeCheckbox } from 'primereact/checkbox';

export function Checkbox({
  checked,
  onChange,
  disabled
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <PrimeCheckbox
      checked={checked}
      onChange={(e) => onChange(Boolean(e.checked))}
      disabled={disabled}
    />
  );
}
