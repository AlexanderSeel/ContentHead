import { Password as PrimePassword } from 'primereact/password';

export function Password({
  value,
  onChange,
  placeholder,
  toggleMask
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  toggleMask?: boolean;
}) {
  return (
    <PrimePassword
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      toggleMask={toggleMask}
      feedback={false}
    />
  );
}
