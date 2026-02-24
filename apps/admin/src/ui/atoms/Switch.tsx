import { InputSwitch } from 'primereact/inputswitch';

export function Switch({ value, onChange, disabled }: { value: boolean; onChange: (next: boolean) => void; disabled?: boolean }) {
  return <InputSwitch checked={value} onChange={(event) => onChange(Boolean(event.value))} disabled={disabled} />;
}
