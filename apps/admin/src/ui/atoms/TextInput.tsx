import { InputText } from 'primereact/inputtext';

type Option = {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  readOnly?: boolean;
};

export function TextInput({ value, onChange, placeholder, readOnly }: Option) {
  return <InputText value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} readOnly={readOnly} />;
}
