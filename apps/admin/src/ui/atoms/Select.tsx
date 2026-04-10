import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import * as Popover from '@radix-ui/react-popover';

export type SelectOption<T extends string | number> = { label: string; value: T };

const NULL_SENTINEL = '__null__';

function toRadixValue(v: string | number | null): string {
  return v == null ? NULL_SENTINEL : String(v);
}

function fromRadixValue<T extends string | number>(
  raw: string,
  options: SelectOption<T>[]
): T | null {
  if (raw === NULL_SENTINEL || raw === '') return null;
  const match = options.find((o) => String(o.value) === raw);
  return match ? match.value : null;
}

// ─── Searchable (filter=true) variant via Popover ───────────────────────────

function SelectWithFilter<T extends string | number>({
  value,
  options,
  onChange,
  placeholder,
  className,
  disabled
}: {
  value: T | null;
  options: SelectOption<T>[];
  onChange: (next: T | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  const selectedLabel = options.find((o) => o.value === value)?.label;
  const classes = ['p-dropdown', 'p-component', 'p-inputwrapper', className, disabled ? 'p-disabled' : '']
    .filter(Boolean)
    .join(' ');

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') setOpen(false);
  };

  return (
    <Popover.Root open={open} {...(!disabled ? { onOpenChange: setOpen } : {})}>
      <Popover.Trigger asChild>
        <div className={classes} role="combobox" aria-expanded={open} tabIndex={disabled ? -1 : 0}>
          <span className={`p-dropdown-label p-inputtext${value == null ? ' p-placeholder' : ''}`}>
            {selectedLabel ?? placeholder ?? '\u00A0'}
          </span>
          <div className="p-dropdown-trigger">
            <span className="p-dropdown-trigger-icon pi pi-chevron-down" />
          </div>
        </div>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="p-dropdown-panel p-component"
          align="start"
          sideOffset={2}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="p-dropdown-header">
            <div className="p-dropdown-filter-container">
              <input
                ref={inputRef}
                className="p-dropdown-filter p-inputtext p-component"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search…"
              />
              <span className="p-dropdown-filter-icon pi pi-search" />
            </div>
          </div>
          <div className="p-dropdown-items-wrapper">
            <ul className="p-dropdown-items" role="listbox">
              {filtered.map((opt) => (
                <li
                  key={String(opt.value)}
                  className={`p-dropdown-item${opt.value === value ? ' p-highlight' : ''}`}
                  role="option"
                  aria-selected={opt.value === value}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  {opt.label}
                </li>
              ))}
              {filtered.length === 0 && (
                <li className="p-dropdown-item p-disabled">No results</li>
              )}
            </ul>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

// ─── Standard (no filter) variant via Radix Select ──────────────────────────

function SelectStandard<T extends string | number>({
  value,
  options,
  onChange,
  placeholder,
  showClear,
  className,
  disabled
}: {
  value: T | null;
  options: SelectOption<T>[];
  onChange: (next: T | null) => void;
  placeholder?: string;
  showClear?: boolean;
  className?: string;
  disabled?: boolean;
}) {
  const classes = ['p-dropdown', 'p-component', 'p-inputwrapper', className, disabled ? 'p-disabled' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <SelectPrimitive.Root
      value={toRadixValue(value)}
      onValueChange={(raw) => onChange(fromRadixValue(raw, options))}
      disabled={disabled ?? false}
    >
      <SelectPrimitive.Trigger className={classes}>
        <SelectPrimitive.Value
          placeholder={placeholder}
          className="p-dropdown-label p-inputtext"
        />
        <SelectPrimitive.Icon className="p-dropdown-trigger">
          <span className="p-dropdown-trigger-icon pi pi-chevron-down" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className="p-dropdown-panel p-component"
          position="popper"
          sideOffset={2}
        >
          <SelectPrimitive.Viewport className="p-dropdown-items-wrapper">
            <ul className="p-dropdown-items" role="listbox">
              {showClear && value != null && (
                <SelectPrimitive.Item value={NULL_SENTINEL} className="p-dropdown-item p-dropdown-clearable">
                  <SelectPrimitive.ItemText>—</SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              )}
              {options.map((opt) => (
                <SelectPrimitive.Item
                  key={String(opt.value)}
                  value={toRadixValue(opt.value)}
                  className="p-dropdown-item"
                >
                  <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              ))}
            </ul>
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

// ─── Public atom ─────────────────────────────────────────────────────────────

export function Select<T extends string | number>({
  value,
  options,
  onChange,
  placeholder,
  filter,
  showClear,
  editable: _editable,
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
  if (filter) {
    return (
      <SelectWithFilter
        value={value}
        options={options}
        onChange={onChange}
        {...(placeholder !== undefined ? { placeholder } : {})}
        {...(className !== undefined ? { className } : {})}
        {...(disabled !== undefined ? { disabled } : {})}
      />
    );
  }
  return (
    <SelectStandard
      value={value}
      options={options}
      onChange={onChange}
      {...(placeholder !== undefined ? { placeholder } : {})}
      {...(showClear !== undefined ? { showClear } : {})}
      {...(className !== undefined ? { className } : {})}
      {...(disabled !== undefined ? { disabled } : {})}
    />
  );
}
