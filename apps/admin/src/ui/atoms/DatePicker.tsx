import { Calendar } from 'primereact/calendar';

export function DatePicker({
  value,
  onChange,
  showTime
}: {
  value: Date | null;
  onChange: (next: Date | null) => void;
  showTime?: boolean;
}) {
  return <Calendar value={value} onChange={(event) => onChange((event.value as Date | null) ?? null)} showTime={showTime} hourFormat="24" showIcon />;
}
