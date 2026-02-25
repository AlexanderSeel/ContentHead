import { Button } from 'primereact/button';

export function ForbiddenState({
  title = 'Forbidden',
  reason,
  onBack
}: {
  title?: string;
  reason: string;
  onBack?: () => void;
}) {
  return (
    <div className="status-panel" role="alert" aria-live="polite">
      <h3 className="mt-0">{title}</h3>
      <p className="muted mb-3">
        {reason}
      </p>
      {onBack ? <Button label="Go back" severity="secondary" onClick={onBack} /> : null}
    </div>
  );
}

