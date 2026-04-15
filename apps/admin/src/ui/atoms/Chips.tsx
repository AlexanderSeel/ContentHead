import { useState, type KeyboardEvent } from 'react';

export type ChipsChangeEvent = { value: string[] | null };

export type ChipsBaseProps = {
  value?: string[] | null;
  onChange?: (event: ChipsChangeEvent) => void;
  separator?: string;
  placeholder?: string;
  className?: string;
};

export function Chips({ value, onChange, separator = ',', placeholder, className }: ChipsBaseProps) {
  const [input, setInput] = useState('');
  const chips = value ?? [];

  const commit = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed || chips.includes(trimmed)) return;
    onChange?.({ value: [...chips, trimmed] });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const isSep = separator && e.key === separator;
    if (e.key === 'Enter' || isSep) {
      e.preventDefault();
      commit(input);
      setInput('');
    } else if (e.key === 'Backspace' && input === '' && chips.length > 0) {
      onChange?.({ value: chips.slice(0, -1) });
    }
  };

  const remove = (idx: number) => {
    onChange?.({ value: chips.filter((_, i) => i !== idx) });
  };

  const classes = ['p-chips', 'p-component', className].filter(Boolean).join(' ');
  return (
    <div className={classes}>
      <ul className="p-chips-multiple-container">
        {chips.map((chip, idx) => (
          <li key={idx} className="p-chips-token">
            <span className="p-chips-token-label">{chip}</span>
            <span
              className="p-chips-token-icon pi pi-times-circle"
              onClick={() => remove(idx)}
              role="button"
              aria-label={`Remove ${chip}`}
            />
          </li>
        ))}
        <li className="p-chips-input-token">
          <input
            className="p-inputtext"
            value={input}
            placeholder={chips.length === 0 ? (placeholder ?? '') : ''}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (input.trim()) {
                commit(input);
                setInput('');
              }
            }}
          />
        </li>
      </ul>
    </div>
  );
}
