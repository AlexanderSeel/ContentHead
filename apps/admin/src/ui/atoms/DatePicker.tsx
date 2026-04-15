function toInputValue(date: Date | null, includeTime: boolean): string {
  if (!date) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const M = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  if (!includeTime) return `${y}-${M}-${d}`;
  const h = pad(date.getHours());
  const m = pad(date.getMinutes());
  const s = pad(date.getSeconds());
  return `${y}-${M}-${d}T${h}:${m}:${s}`;
}

function fromInputValue(raw: string): Date | null {
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

export function DatePicker({
  value,
  onChange,
  showTime,
  showSeconds: _showSeconds,
  dateFormat: _dateFormat,
  disabled
}: {
  value: Date | null;
  onChange: (next: Date | null) => void;
  showTime?: boolean;
  showIcon?: boolean;
  showSeconds?: boolean;
  dateFormat?: string;
  disabled?: boolean;
}) {
  const inputType = showTime ? 'datetime-local' : 'date';
  return (
    <input
      type={inputType}
      className="p-inputtext p-component p-datepicker-input"
      value={toInputValue(value, showTime ?? false)}
      disabled={disabled ?? false}
      onChange={(e) => onChange(fromInputValue(e.target.value))}
    />
  );
}
