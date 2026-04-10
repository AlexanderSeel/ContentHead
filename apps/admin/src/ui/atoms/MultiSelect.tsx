import { MultiSelect as PrimeMultiSelect } from 'primereact/multiselect';

import type { SelectOption } from './Select';

export function MultiSelect<T extends string | number>({
  value,
  options,
  onChange,
  placeholder,
  display = 'chip',
  disabled
}: {
  value: T[];
  options: SelectOption<T>[];
  onChange: (next: T[]) => void;
  placeholder?: string;
  display?: 'chip' | 'comma';
  disabled?: boolean;
}) {
  return (
    <PrimeMultiSelect
      value={value}
      options={options}
      optionLabel="label"
      optionValue="value"
      onChange={(event) => onChange((event.value as T[]) ?? [])}
      placeholder={placeholder}
      display={display}
      disabled={disabled}
    />
  );
}
