import { Button, Tooltip } from '../ui/atoms';

export function HelpIcon({ tooltip, onClick }: { tooltip: string; onClick: () => void }) {
  return (
    <Tooltip content={tooltip} position="top">
      <Button text rounded icon="pi pi-question-circle" aria-label="Help" onClick={onClick} />
    </Tooltip>
  );
}
