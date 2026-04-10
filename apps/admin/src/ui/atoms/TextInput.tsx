export function TextInput({
  value,
  onChange,
  placeholder,
  readOnly,
  disabled
}: {
  value: string;
  onChange?: (next: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  disabled?: boolean;
}) {
  return (
    <input
      type="text"
      className="p-inputtext p-component"
      value={value}
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      placeholder={placeholder}
      readOnly={readOnly}
      disabled={disabled}
    />
  );
}
