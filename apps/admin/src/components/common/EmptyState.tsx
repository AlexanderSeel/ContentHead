import { Button, Card } from '../../ui/atoms';

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <Card className="empty-state">
      <h3>{title}</h3>
      <p>{description}</p>
      {actionLabel ? <Button label={actionLabel} onClick={onAction} /> : null}
    </Card>
  );
}
