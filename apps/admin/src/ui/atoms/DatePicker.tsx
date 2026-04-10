import { Calendar } from 'primereact/calendar';

export function DatePicker({
  value,
  onChange,
  showTime,
  showIcon = true,
  showSeconds,
  dateFormat,
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
  return (
    <Calendar
      value={value}
      onChange={(event) => onChange((event.value as Date | null) ?? null)}
      showTime={showTime ?? false}
      hourFormat="24"
      showIcon={showIcon}
      {...(showSeconds !== undefined ? { showSeconds } : {})}
      {...(dateFormat !== undefined ? { dateFormat } : {})}
      disabled={disabled ?? false}
    />
  );
}
