import { useState, useRef, useEffect, type KeyboardEvent, type ReactNode } from 'react';
import * as Popover from '@radix-ui/react-popover';

export type AutoCompleteCompleteEvent = { query: string };
export type AutoCompleteChangeEvent = { value: unknown };

export type AutoCompleteProps = {
  value?: unknown;
  suggestions?: unknown[];
  completeMethod?: (event: AutoCompleteCompleteEvent) => void;
  /** Dot-path into suggestion object to display as label. */
  field?: string;
  itemTemplate?: (item: unknown) => ReactNode;
  onChange?: (event: AutoCompleteChangeEvent) => void;
  placeholder?: string;
  /** Show a dropdown button to open suggestions without typing. */
  dropdown?: boolean;
  className?: string;
  disabled?: boolean;
};

function getField(item: unknown, field?: string): string {
  if (!field || typeof item !== 'object' || item === null) return String(item ?? '');
  return String((item as Record<string, unknown>)[field] ?? '');
}

export function AutoComplete({
  value,
  suggestions = [],
  completeMethod,
  field,
  itemTemplate,
  onChange,
  placeholder,
  dropdown,
  className,
  disabled
}: AutoCompleteProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(getField(value, field));
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync external value changes
  useEffect(() => {
    setInputValue(getField(value, field));
  }, [value, field]);

  const handleInput = (raw: string) => {
    setInputValue(raw);
    onChange?.({ value: raw });
    completeMethod?.({ query: raw });
    setOpen(true);
  };

  const handleSelect = (item: unknown) => {
    setInputValue(getField(item, field));
    onChange?.({ value: item });
    setOpen(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') setOpen(false);
  };

  const classes = ['p-autocomplete', 'p-component', className, disabled ? 'p-disabled' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <Popover.Root open={open && suggestions.length > 0} onOpenChange={setOpen}>
      <Popover.Anchor asChild>
        <span className={classes}>
          <input
            ref={inputRef}
            className="p-inputtext p-component p-autocomplete-input"
            value={inputValue}
            placeholder={placeholder}
            disabled={disabled}
            onChange={(e) => handleInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (inputValue) {
                completeMethod?.({ query: inputValue });
                setOpen(true);
              }
            }}
          />
          {dropdown && (
            <button
              type="button"
              className="p-autocomplete-dropdown p-button p-button-icon-only"
              disabled={disabled}
              onClick={() => {
                completeMethod?.({ query: inputValue });
                setOpen(true);
                setTimeout(() => inputRef.current?.focus(), 0);
              }}
            >
              <span className="pi pi-chevron-down" aria-hidden />
            </button>
          )}
        </span>
      </Popover.Anchor>
      <Popover.Portal>
        <Popover.Content
          className="p-autocomplete-panel p-dropdown-panel p-component"
          align="start"
          sideOffset={2}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <ul className="p-autocomplete-items p-dropdown-items" role="listbox">
            {suggestions.map((item, idx) => (
              <li
                key={idx}
                className="p-autocomplete-item p-dropdown-item"
                role="option"
                onClick={() => handleSelect(item)}
              >
                {itemTemplate ? itemTemplate(item) : getField(item, field)}
              </li>
            ))}
          </ul>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
