import { Dropdown } from 'primereact/dropdown';

export type SelectOption<T extends string | number> = { label: string; value: T };

export function Select<T extends string | number>({
  value,
  options,
  onChange,
  placeholder,
  filter,
  showClear,
  editable,
  className,
  disabled
}: {
  value: T | null;
  options: SelectOption<T>[];
  onChange: (next: T | null) => void;
  placeholder?: string;
  filter?: boolean;
  showClear?: boolean;
  editable?: boolean;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <Dropdown
      value={value}
      options={options}
      onChange={(event) => onChange((event.value as T | null) ?? null)}
      placeholder={placeholder}
      filter={filter}
      showClear={showClear}
      editable={editable}
      className={className}
      disabled={disabled}
    />
  );
}
