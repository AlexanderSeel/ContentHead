import * as RadixCheckbox from '@radix-ui/react-checkbox';

export function Checkbox({
  checked,
  onChange,
  disabled
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  const wrapperClass = ['p-checkbox', 'p-component', checked ? 'p-checkbox-checked' : '', disabled ? 'p-disabled' : '']
    .filter(Boolean)
    .join(' ');
  const boxClass = ['p-checkbox-box', checked ? 'p-highlight' : ''].filter(Boolean).join(' ');

  return (
    <div className={wrapperClass}>
      <RadixCheckbox.Root
        checked={checked}
        onCheckedChange={(c) => onChange(c === true)}
        disabled={disabled}
        className={boxClass}
        style={{ appearance: 'none', background: 'transparent', border: 'none', padding: 0 }}
      >
        <RadixCheckbox.Indicator asChild>
          <span className="p-checkbox-icon pi pi-check" />
        </RadixCheckbox.Indicator>
      </RadixCheckbox.Root>
    </div>
  );
}
