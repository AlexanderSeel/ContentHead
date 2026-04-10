import { Tag as PrimeTag } from 'primereact/tag';

export function Tag({
  value,
  severity
}: {
  value: string;
  severity?: 'success' | 'info' | 'warning' | 'danger';
}) {
  return <PrimeTag value={value} severity={severity} />;
}
