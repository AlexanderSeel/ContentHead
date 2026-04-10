const severityClass: Record<string, string> = {
  success: 'p-tag-success',
  info: 'p-tag-info',
  warning: 'p-tag-warning',
  danger: 'p-tag-danger'
};

export function Tag({
  value,
  severity
}: {
  value: string;
  severity?: 'success' | 'info' | 'warning' | 'danger' | 'secondary';
}) {
  const classes = ['p-tag', severity ? severityClass[severity] : ''].filter(Boolean).join(' ');
  return (
    <span className={classes}>
      <span className="p-tag-value">{value}</span>
    </span>
  );
}
