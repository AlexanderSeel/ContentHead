import { useState, useRef, useEffect } from 'react';
import * as Popover from '@radix-ui/react-popover';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';

import type { SelectOption } from './Select';

export function MultiSelect<T extends string | number>({
  value,
  options,
  onChange,
  placeholder,
  display = 'chip',
  filter,
  maxSelectedLabels,
  className,
  disabled
}: {
  value: T[];
  options: SelectOption<T>[];
  onChange: (next: T[]) => void;
  placeholder?: string;
  display?: 'chip' | 'comma';
  filter?: boolean;
  maxSelectedLabels?: number;
  className?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = filter && query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  useEffect(() => {
    if (open && filter) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open, filter]);

  const toggle = (v: T) => {
    if (value.includes(v)) {
      onChange(value.filter((x) => x !== v));
    } else {
      onChange([...value, v]);
    }
  };

  const triggerClasses = [
    'p-multiselect',
    'p-component',
    'p-inputwrapper',
    value.length > 0 ? 'p-multiselect-chip' : '',
    className,
    disabled ? 'p-disabled' : ''
  ]
    .filter(Boolean)
    .join(' ');

  const renderTriggerLabel = () => {
    if (value.length === 0) {
      return <span className="p-multiselect-label p-placeholder">{placeholder ?? 'Select…'}</span>;
    }
    const max = maxSelectedLabels ?? (display === 'chip' ? 3 : undefined);
    const overMax = max !== undefined && value.length > max;
    const visible = overMax ? value.slice(0, max) : value;
    const labels = visible.map((v) => options.find((o) => o.value === v)?.label ?? String(v));

    if (display === 'chip') {
      return (
        <div className="p-multiselect-label">
          {labels.map((label, i) => (
            <div key={i} className="p-multiselect-token">
              <span className="p-multiselect-token-label">{label}</span>
            </div>
          ))}
          {overMax && <span className="p-multiselect-token">{`+${value.length - (max ?? 0)}`}</span>}
        </div>
      );
    }
    return (
      <span className="p-multiselect-label">
        {overMax ? `${labels.join(', ')} (+${value.length - (max ?? 0)})` : labels.join(', ')}
      </span>
    );
  };

  return (
    <Popover.Root open={open} {...(!disabled ? { onOpenChange: setOpen } : {})}>
      <Popover.Trigger asChild>
        <div className={triggerClasses} role="combobox" aria-expanded={open} tabIndex={disabled ? -1 : 0}>
          {renderTriggerLabel()}
          <div className="p-multiselect-trigger">
            <span className="p-multiselect-trigger-icon pi pi-chevron-down" />
          </div>
        </div>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="p-multiselect-panel p-component"
          align="start"
          sideOffset={2}
          onOpenAutoFocus={(e) => { if (!filter) e.preventDefault(); }}
        >
          {filter && (
            <div className="p-multiselect-header">
              <div className="p-multiselect-filter-container">
                <input
                  ref={inputRef}
                  className="p-multiselect-filter p-inputtext p-component"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); }}
                  placeholder="Search…"
                />
                <span className="p-multiselect-filter-icon pi pi-search" />
              </div>
            </div>
          )}
          <div className="p-multiselect-items-wrapper">
            <ul className="p-multiselect-items" role="listbox">
              {filtered.map((opt) => {
                const checked = value.includes(opt.value);
                return (
                  <li
                    key={String(opt.value)}
                    className={`p-multiselect-item${checked ? ' p-highlight' : ''}`}
                    role="option"
                    aria-selected={checked}
                    onClick={() => toggle(opt.value)}
                  >
                    <div className="p-checkbox p-component">
                      <CheckboxPrimitive.Root
                        checked={checked}
                        onCheckedChange={() => toggle(opt.value)}
                        className={`p-checkbox-box${checked ? ' p-highlight' : ''}`}
                        style={{ appearance: 'none', background: 'transparent', border: 'none', padding: 0 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <CheckboxPrimitive.Indicator asChild>
                          <span className="p-checkbox-icon pi pi-check" />
                        </CheckboxPrimitive.Indicator>
                      </CheckboxPrimitive.Root>
                    </div>
                    <span>{opt.label}</span>
                  </li>
                );
              })}
              {filtered.length === 0 && (
                <li className="p-multiselect-item p-disabled">No results</li>
              )}
            </ul>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
