import { useEffect, useRef } from 'react';

export function Textarea({
  value,
  onChange,
  placeholder,
  rows,
  readOnly,
  autoResize,
  disabled
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  rows?: number;
  readOnly?: boolean;
  autoResize?: boolean;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoResize && ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = `${ref.current.scrollHeight}px`;
    }
  }, [value, autoResize]);

  return (
    <textarea
      ref={ref}
      className="p-inputtextarea p-component"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      readOnly={readOnly}
      disabled={disabled}
    />
  );
}
